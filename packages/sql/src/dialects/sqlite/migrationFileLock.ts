import { mkdir, open, readFile, rm, stat, type FileHandle } from 'node:fs/promises';
import { dirname } from 'node:path';
import { threadId } from 'node:worker_threads';

const tails = new Map<string, Promise<void>>();

function delay(ms: number): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

function isAlreadyExists(error: unknown): boolean {
  return (error as NodeJS.ErrnoException).code === 'EEXIST';
}

async function lockIsStale(lockPath: string): Promise<boolean> {
  let raw: string;

  try {
    raw = (await readFile(lockPath, 'utf8')).trim();
  } catch (error) {
    // The holder removed it between our failed `open` and this read. Retry the create.
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return false;
    }

    throw error;
  }

  const [pid, owner = 0] = raw.split(':').map(Number);

  // Empty or partial contents: the owner is between `open` and `writeFile`, or crashed there.
  // Give a live owner a moment before taking the file.
  if (!Number.isInteger(pid) || pid <= 0) {
    const info = await stat(lockPath).catch(() => undefined);
    return info != null && Date.now() - info.mtimeMs > 5_000;
  }

  // Same pid and thread is a previous incarnation (e.g. a restarted container); live holders here are queued by `tails`.
  if (pid === process.pid) {
    return owner === threadId;
  }

  try {
    process.kill(pid, 0);
    return false;
  } catch (error) {
    return (error as NodeJS.ErrnoException).code === 'ESRCH';
  }
}

async function acquireLockFile(lockPath: string): Promise<FileHandle> {
  for (;;) {
    try {
      const handle = await open(lockPath, 'wx');

      try {
        await handle.writeFile(`${process.pid}:${threadId}`);
      } catch (error) {
        await handle.close().catch(() => undefined);
        await rm(lockPath, { force: true }).catch(() => undefined);
        throw error;
      }

      return handle;
    } catch (error) {
      if (!isAlreadyExists(error)) {
        throw error;
      }

      if (await lockIsStale(lockPath)) {
        await rm(lockPath, { force: true }).catch(() => undefined);
        continue;
      }

      await delay(25);
    }
  }
}

/**
 * Cross-process lock for file-backed SQLite.
 *
 * SQLite locks the whole database file, so holding `BEGIN IMMEDIATE` on a side
 * connection would block the migration's own writes. A sibling lock file keeps
 * the wait outside the database the migrator has to write to. The lock is
 * cooperative: the file contains the owner's pid and thread id and is removed on release.
 * A pid that is no longer running is treated as abandoned.
 */
export async function withMigrationFileLock<T>(lockPath: string, fn: () => Promise<T>): Promise<T> {
  const previous = tails.get(lockPath) ?? Promise.resolve();
  let releaseQueue!: () => void;
  const current = new Promise<void>(resolve => {
    releaseQueue = resolve;
  });
  const tail = previous.then(() => current);
  tails.set(lockPath, tail);
  await previous;

  try {
    await mkdir(dirname(lockPath), { recursive: true });
    const handle = await acquireLockFile(lockPath);

    try {
      return await fn();
    } finally {
      await handle.close().catch(() => undefined);
      await rm(lockPath, { force: true }).catch(() => undefined);
    }
  } finally {
    releaseQueue();

    if (tails.get(lockPath) === tail) {
      tails.delete(lockPath);
    }
  }
}
