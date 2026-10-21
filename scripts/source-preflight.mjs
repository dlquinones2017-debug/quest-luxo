import { constants } from "node:fs";
import { open, realpath } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { previewBusinessSource } from "../src/lib/agents/businessSourcePreflight.ts";

async function privateJSON(file) {
  const path = resolve(file);
  if (await realpath(path) !== path) throw Error("Private real input path required.");
  const handle = await open(path, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0));
  try {
    const stat = await handle.stat();
    if (!stat.isFile() || stat.size < 1 || stat.size > 524288 || (process.platform !== "win32" && (stat.mode & 0o077)))
      throw Error("Private bounded file required.");
    // Bound actual reads as well as the initial size: a concurrently growing file cannot expand this allocation.
    const bytes = Buffer.alloc(524289);
    let length = 0;
    while (length < bytes.length) {
      const { bytesRead } = await handle.read(bytes, length, bytes.length - length, null);
      if (!bytesRead) break;
      length += bytesRead;
    }
    if (length > 524288) throw Error("Input too large.");
    return JSON.parse(bytes.subarray(0, length).toString("utf8"));
  } finally { await handle.close(); }
}
export async function main(args = process.argv.slice(2), now = new Date().toISOString()) {
  if (args.length !== 3) throw Error("Usage: source-preflight.mjs CONTRACT_FILE METADATA_FILE EVIDENCE_FILE");
  const contract = await privateJSON(args[0]);
  const envelope = await privateJSON(args[1]);
  const evidence = await privateJSON(args[2]);
  return previewBusinessSource(contract, envelope, evidence, now);
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { console.log(JSON.stringify(await main(), null, 2)); }
  catch { console.error("Source preflight rejected. No input data printed, persisted or activated."); process.exitCode = 1; }
}
