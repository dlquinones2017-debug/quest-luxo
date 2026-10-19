import { mkdir, open, unlink } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { setTimeout as delay } from "node:timers/promises";

// All application writers and the exact smoke-test cleanup share this lock.
// A process crash leaves the lock in place: never guess that another writer is
// dead or automatically remove its lock. An operator must verify recovery.
export async function withLeadStorageLock<T>(
  file: string,
  operation: () => Promise<T>,
  options: { readonly timeoutMs?: number } = {},
): Promise<T> {
  const lockFile = `${resolve(file)}.lock`;
  const timeoutMs = options.timeoutMs ?? 10_000;
  if (!Number.isFinite(timeoutMs) || timeoutMs < 0 || timeoutMs > 10_000) {
    throw new Error("Invalid lead storage lock timeout.");
  }
  await mkdir(dirname(lockFile), { recursive: true });
  const deadline = performance.now() + timeoutMs;
  let handle;
  while (!handle) {
    try {
      handle = await open(lockFile, "wx", 0o600);
    } catch (error) {
      if (!(error instanceof Error && "code" in error && error.code === "EEXIST")) throw error;
      if (performance.now() >= deadline) throw new Error("Lead storage is busy; operator verification may be required.");
      await delay(Math.min(25, Math.max(1, deadline - performance.now())));
    }
  }
  try {
    return await operation();
  } finally {
    // Keep the lock if closing fails; never expose a possibly active writer.
    await handle.close();
    await unlink(lockFile);
  }
}
