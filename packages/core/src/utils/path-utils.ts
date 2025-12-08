/** Convert Windows backslashes → POSIX forward slashes */
function toPosix(path: string): string {
  return path.replace(/\\/g, '/');
}

/** Simple heuristic to detect Windows absolute paths (C:/foo or \\server) */
function isAbsolute(p: string): boolean {
  p = toPosix(p);
  return (
    p.startsWith('/') || // POSIX
    /^[a-zA-Z]:\//.test(p) || // C:/Users
    p.startsWith('//') // UNC: //server/share
  );
}

/** Normalize path: convert \ → /, resolve ., .., remove dup slashes */
function normalize(p: string): string {
  p = toPosix(p);

  const absolute = isAbsolute(p);
  const parts: string[] = [];

  for (const part of p.split('/')) {
    if (!part || part === '.') {
      continue;
    }
    if (part === '..') {
      if (parts.length) {
        parts.pop();
      }
      continue;
    }
    parts.push(part);
  }

  const joined = parts.join('/');
  return absolute ? '/' + joined : joined || '.';
}

function relative(from: string, to: string): string {
  from = normalize(from);
  to = normalize(to);

  if (from === to) {
    return '';
  }

  const fromParts = from.split('/').filter(Boolean);
  const toParts = to.split('/').filter(Boolean);

  // Find common prefix
  let i = 0;
  while (i < fromParts.length && i < toParts.length && fromParts[i] === toParts[i]) {
    i++;
  }

  // How many directories to go up from "from"
  const up = fromParts.length - i;

  // "../" repeated for each remaining part of from
  const result = [
    ...Array(up).fill('..'),
    ...toParts.slice(i),
  ].join('/');

  return result || '';
}

function fileURLToPath(url: string | URL): string {
  const u = typeof url === 'string' ? new URL(url) : url;

  if (u.protocol !== 'file:') {
    throw new TypeError('URL must be a file:// URL');
  }

  let p = decodeURIComponent(u.pathname);

  // Handle Windows drive letters: /C:/foo → C:/foo
  if (/^\/[a-zA-Z]:\//.test(p)) {
    p = p.slice(1);
  }

  return normalize(p);
}

export function pathToFileURL(input: string): URL {
  let p = toPosix(input);

  // If input is already a file:// URL string
  if (typeof p === 'string' && p.startsWith('file://')) {
    return new URL(p);
  }

  // If relative, try to resolve against runtime cwd first
  if (!isAbsolute(p)) {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    p = path.absolutePath(p);
  }

  // At this point p should be absolute
  p = normalize(p);

  // Windows drive letter: produce file:///C:/path
  if (/^[a-zA-Z]:\//.test(p)) {
    return new URL('file:///' + p);
  }

  // POSIX absolute
  if (p.startsWith('/')) {
    return new URL('file://' + p);
  }

  // As a last resort, throw
  throw new TypeError(`pathToFileURL: failed to convert path to file URL: "${input}"`);
}

/** @internal */
export const path = {

  pathToFileURL,
  fileURLToPath,

  /**
   * Resolves and normalizes a series of path parts relative to each preceding part.
   * If any part is a `file:` URL, it is converted to a local path. If any part is an
   * absolute path, it replaces preceding paths (similar to `path.resolve` in NodeJS).
   * Trailing directory separators are removed, and all directory separators are converted
   * to POSIX-style separators (`/`).
   */
  normalizePath(...parts: string[]): string {
    let start = 0;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (isAbsolute(part)) {
        start = i;
      } else if (part.startsWith('file:')) {
        start = i;
        parts[i] = path.fileURLToPath(part);
      }
    }

    if (start > 0) {
      parts = parts.slice(start);
    }

    // eslint-disable-next-line @typescript-eslint/naming-convention
    let path_ = parts.join('/').replace(/\\/g, '/').replace(/\/$/, '');
    path_ = normalize(path_).replace(/\\/g, '/');

    return (path_.match(/^[/.]|[a-zA-Z]:/) || path_.startsWith('!')) ? path_ : './' + path_;
  },

  /**
   * Determines the relative path between two paths. If either path is a `file:` URL,
   * it is converted to a local path.
   */
  relativePath(path_: string, relativeTo: string): string {
    if (!path_) {
      return path_;
    }

    path_ = path.normalizePath(path_);

    if (path_.startsWith('.')) {
      return path_;
    }

    path_ = relative(path.normalizePath(relativeTo), path_);

    return path.normalizePath(path_);
  },

  /**
   * Computes the absolute path to for the given path relative to the provided base directory.
   * If either `path` or `baseDir` are `file:` URLs, they are converted to local paths.
   */
  absolutePath(path_: string, baseDir = process.cwd()): string {
    if (!path_) {
      return path.normalizePath(baseDir);
    }

    if (!isAbsolute(path_) && !path_.startsWith('file://')) {
      path_ = baseDir + '/' + path_;
    }

    return path.normalizePath(path_);
  },

};
