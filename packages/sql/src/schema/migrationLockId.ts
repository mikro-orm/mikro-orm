/**
 * Stable id for a migration lock name.
 *
 * PostgreSQL advisory locks take two int4 keys. MySQL `GET_LOCK` / SQL Server
 * `sp_getapplock` take a short string. Both are derived from the same hash so
 * one migrations table always maps to one lock, and the string stays under
 * MySQL's 64 character name limit.
 */
export function migrationLockId(name: string): { key1: number; key2: number; token: string } {
  // FNV-1a, two lanes so the pair isn't a single 32-bit value.
  let h1 = 0x811c9dc5;
  let h2 = 0x811c9dc5 ^ 0x9e3779b9;

  for (let i = 0; i < name.length; i++) {
    const code = name.charCodeAt(i);
    h1 = Math.imul(h1 ^ code, 0x01000193);
    h2 = Math.imul(h2 ^ code, 0x01000193);
  }

  const key1 = h1 | 0;
  const key2 = h2 | 0;
  const hex = (value: number) => (value >>> 0).toString(16).padStart(8, '0');

  return { key1, key2, token: `mikro-orm:${hex(key1)}${hex(key2)}` };
}
