import { MemoryCacheAdapter } from '@mikro-orm/core';

describe('MemoryCacheAdapter', () => {

  test('should ignore old cache', async () => {
    const cache = new MemoryCacheAdapter({ expiration: 10 });
    await cache.set('cache-test-handle-1', 123, '');
    await expect(cache.get('cache-test-handle-1')).resolves.toBe(123);

    await new Promise(resolve => setTimeout(resolve, 20));
    await expect(cache.get('cache-test-handle-1')).resolves.toBeUndefined();
    await cache.clear();
  });

});
