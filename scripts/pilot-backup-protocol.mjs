import { createHmac, createHash, timingSafeEqual } from 'node:crypto';

export const BACKUP_CLIENT_ID = 'windows-recovery-primary';
export const BACKUP_PATH = '/pilot-backup/v1';
export function canonicalJSON(value) {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return JSON.stringify(value);
  if (typeof value === 'number' && Number.isSafeInteger(value)) return JSON.stringify(value);
  if (Array.isArray(value)) return '[' + value.map(canonicalJSON).join(',') + ']';
  if (value && Object.getPrototypeOf(value) === Object.prototype)
    return '{' + Object.keys(value).sort().map(k => JSON.stringify(k) + ':' + canonicalJSON(value[k])).join(',') + '}';
  throw Error('Bounded JSON values required.');
}
function mac(key, purpose, value) {
  if (!Buffer.isBuffer(key) || key.length !== 32) throw Error('32-byte key required.');
  const derived = createHmac('sha256', key).update('QUEST_PILOT_BACKUP_V1:' + purpose).digest();
  try { return createHmac('sha256', derived).update(value).digest('hex'); }
  finally { derived.fill(0); }
}
function equal(expected, actual) {
  return typeof actual === 'string' && /^[a-f0-9]{64}$/.test(actual) &&
    timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(actual, 'hex'));
}
function requestPayload(f) {
  if (!f || f.clientId !== BACKUP_CLIENT_ID || !['GET', 'POST'].includes(f.method) ||
      f.path !== (f.method === 'GET' ? BACKUP_PATH : BACKUP_PATH + '/ack') ||
      typeof f.timestamp !== 'string' || !Number.isFinite(Date.parse(f.timestamp)) || new Date(f.timestamp).toISOString() !== f.timestamp ||
      typeof f.nonce !== 'string' || !/^[a-f0-9]{32}$/.test(f.nonce) || typeof f.body !== 'string' ||
      Buffer.byteLength(f.body) > 16384 || (f.method === 'GET' && f.body !== '')) throw Error('Invalid backup request.');
  return canonicalJSON({ method:f.method,path:f.path,clientId:f.clientId,timestamp:f.timestamp,nonce:f.nonce,
    bodySHA256:createHash('sha256').update(f.body).digest('hex') });
}
export function signRequest(key, fields) { return mac(key, 'request', requestPayload(fields)); }
export function verifyRequest(key, fields, signature, now = Date.now()) {
  try {
    const expected = signRequest(key, fields), age = Number(now) - Date.parse(fields.timestamp);
    return Number.isFinite(Number(now)) && age >= -15000 && age <= 120000 && equal(expected,signature);
  } catch { return false; }
}
export function signPayload(key, payload) { return mac(key, 'response-checkpoint', canonicalJSON(payload)); }
export function verifyPayload(key, payload, signature) {
  try { return equal(signPayload(key,payload),signature); } catch { return false; }
}
