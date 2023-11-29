import { MemoryCacheAdapter } from '@mikro-orm/core';

describe('MemoryCacheAdapter', () => {

  test('should ignore old cache', async () => {
    const cache = new MemoryCacheAdapter({ expiration: 10 });
    cache.set('cache-test-handle-1', 123, '');
    expect(cache.get('cache-test-handle-1')).toBe(123);

    await new Promise(resolve => setTimeout(resolve, 20));
    expect(cache.get('cache-test-handle-1')).toBeUndefined();
    cache.clear();
  });

});
