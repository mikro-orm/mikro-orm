// node built-ins are loaded lazily so this module can be part of the browser-safe main entry
const nodePath = () => globalThis.process.getBuiltinModule('node:path');
const nodeUrl = () => globalThis.process.getBuiltinModule('node:url');

/**
 * Resolves and normalizes a series of path parts relative to each preceding part.
 * If any part is a `file:` URL, it is converted to a local path. If any part is an
 * absolute path, it replaces preceding paths (similar to `path.resolve` in NodeJS).
 * Trailing directory separators are removed, and all directory separators are converted
 * to POSIX-style separators (`/`).
 * @internal
 */
export function normalizePath(...parts: string[]): string {
  const { isAbsolute, normalize } = nodePath();
  let start = 0;

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (isAbsolute(part)) {
      start = i;
    } else if (part.startsWith('file:')) {
      start = i;
      parts[i] = nodeUrl().fileURLToPath(part);
    }
  }

  if (start > 0) {
    parts = parts.slice(start);
  }

  let path = parts.join('/').replace(/\\/g, '/').replace(/\/$/, '');
  path = normalize(path).replace(/\\/g, '/');

  return /^[/.]|[a-zA-Z]:/.exec(path) || path.startsWith('!') ? path : './' + path;
}

/**
 * Determines the relative path between two paths. If either path is a `file:` URL,
 * it is converted to a local path.
 * @internal
 */
export function relativePath(path: string, relativeTo: string): string {
  if (!path) {
    return path;
  }

  path = normalizePath(path);

  if (path.startsWith('.')) {
    return path;
  }

  path = nodePath().relative(normalizePath(relativeTo), path);

  return normalizePath(path);
}

/**
 * Computes the absolute path to for the given path relative to the provided base directory.
 * If either `path` or `baseDir` are `file:` URLs, they are converted to local paths.
 * @internal
 */
export function absolutePath(path: string, baseDir = process.cwd()): string {
  if (!path) {
    return normalizePath(baseDir);
  }

  if (!nodePath().isAbsolute(path) && !path.startsWith('file://')) {
    path = baseDir + '/' + path;
  }

  return normalizePath(path);
}
