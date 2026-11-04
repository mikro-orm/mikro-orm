import type { Dictionary, SessionContext } from '../typings.js';
import { isRaw, isSubquery, Raw } from '../utils/RawQueryFragment.js';
import { Utils } from '../utils/Utils.js';

// JSON loses RegExp patterns, `raw()` params and `raw()` keys (symbols), and throws on bigints and sub-queries; `this[key]` is the value before `toJSON()`
function replacer(this: Dictionary, key: string, value: unknown): unknown {
  const original = isSubquery(this[key]) ? (this[key] as unknown as { toRaw(): Raw }).toRaw() : this[key];

  if (typeof original === 'bigint') {
    return { bigint: original.toString() };
  }

  if (original instanceof RegExp) {
    return { regexp: original.source, flags: original.flags };
  }

  if (isRaw(original)) {
    return { sql: original.sql, params: original.params };
  }

  if (Raw.hasObjectFragments(value)) {
    return Utils.getObjectQueryKeys(value as Dictionary).map(k => [
      Raw.getKnownFragment(k) ?? k,
      (value as Dictionary)[k as string],
    ]);
  }

  return value;
}

/** Serializes a result cache or dataloader batch key, telling apart all values a query can contain. */
export function stringifyCacheKey(key: unknown): string {
  return JSON.stringify(key, replacer);
}

/** Scopes a named result cache key by the session context, so rows are not served across session contexts. */
export function scopeCacheKey(name: string, sessionContext?: SessionContext): string {
  return sessionContext ? `${name}|${JSON.stringify(sessionContext)}` : name;
}
