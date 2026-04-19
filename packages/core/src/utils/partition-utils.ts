/**
 * Split a comma-list of identifiers, respecting double-quoted identifiers (which may contain
 * commas and use `""` to escape embedded quotes). Returns `null` when the input is not a clean
 * comma-list of identifiers (e.g. contains function calls or literals), so callers treat it
 * as an opaque expression.
 */
export function splitCommaSeparatedIdentifiers(value: string): string[] | null {
  const segments: string[] = [];
  let buffer = '';
  let inQuote = false;

  for (let i = 0; i < value.length; i++) {
    const ch = value[i];

    if (ch === '"') {
      if (inQuote && value[i + 1] === '"') {
        buffer += '""';
        i++;
        continue;
      }

      inQuote = !inQuote;
      buffer += ch;
      continue;
    }

    if (!inQuote) {
      if (ch === ',') {
        segments.push(buffer);
        buffer = '';
        continue;
      }

      if (!/[\w.\s]/.test(ch)) {
        return null;
      }
    }

    buffer += ch;
  }

  if (inQuote) {
    return null;
  }

  segments.push(buffer);
  const trimmed = segments.map(s => s.trim());

  if (trimmed.some(s => s === '')) {
    return null;
  }

  return trimmed;
}
