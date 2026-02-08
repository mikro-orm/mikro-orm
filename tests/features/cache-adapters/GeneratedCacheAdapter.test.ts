import { GeneratedCacheAdapter } from '@mikro-orm/core';

describe('GeneratedCacheAdapter', () => {
  test('should ignore old cache', async () => {
    const cache = new GeneratedCacheAdapter({ data: {} });
    cache.set('cache-test-handle-1', 123, '');
    expect(cache.get('cache-test-handle-1')).toEqual({ data: 123 });
    cache.remove('cache-test-handle-1');
    cache.set('cache-test-handle-1', 123, '');
    expect(cache.get('cache-test-handle-1')).toEqual({ data: 123 });
    cache.clear();
    expect(cache.get('cache-test-handle-1')).toEqual(undefined);
  });
});
