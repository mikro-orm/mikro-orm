function normalizeIdentifierSegment(segment: string): string {
  const trimmed = segment.trim();

  if (trimmed.length >= 2 && trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1).replaceAll('""', '"');
  }

  return trimmed.toLowerCase();
}

/**
 * Normalize a partition name for collision detection. Mirrors PostgreSQL identifier
 * resolution: unquoted segments fold to lower case, quoted segments preserve case and
 * un-escape embedded `""`. Returns a canonical `schema.name` form so both schema-qualified
 * and bare names compare consistently (`.name` vs `schema.name` stay distinguishable).
 *
 * `Part_1`, `part_1`, and `"part_1"` all normalize to the same value, catching collisions
 * that would otherwise only surface as runtime PG "relation already exists" errors.
 */
export function normalizePartitionNameForComparison(name: string): string {
  const trimmed = name.trim();
  let depth = 0;

  for (let i = 0; i < trimmed.length; i++) {
    const ch = trimmed[i];

    if (ch === '"') {
      if (trimmed[i + 1] === '"') {
        i++;
        continue;
      }

      depth = depth === 0 ? 1 : 0;
      continue;
    }

    if (ch === '.' && depth === 0) {
      return `${normalizeIdentifierSegment(trimmed.slice(0, i))}.${normalizeIdentifierSegment(trimmed.slice(i + 1))}`;
    }
  }

  return `.${normalizeIdentifierSegment(trimmed)}`;
}

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
