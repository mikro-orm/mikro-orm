// GH #7975 - `EntityMetadata._id` is a process-local runtime counter that leaks into
// serialized metadata cache files. When independent discovery processes populate different
// cache entries, their local counters can assign the same `_id`; loading both cache entries
// then collapses distinct entities under one id in `MetadataStorage`/`CommitOrderCalculator`.
// `loadFromCache()` must keep the fresh runtime `_id` and never restore the cached one.
import { EntityMetadata, MetadataProvider } from '@mikro-orm/core';

test('loadFromCache keeps the runtime _id and merges other cached fields', () => {
  const provider = new MetadataProvider({} as any);

  const meta = new EntityMetadata({ className: 'Alpha', tableName: 'alpha' });
  const runtimeId = meta._id;

  // simulate a cache file written by another process with a colliding/stale _id
  const cache = { _id: runtimeId + 1000, collection: 'alpha_cached', properties: {} } as unknown as EntityMetadata;

  provider.loadFromCache(meta, cache);

  expect(meta._id).toBe(runtimeId);
  expect((meta as any).collection).toBe('alpha_cached');
});
