import { MemoryCacheAdapter } from '@mikro-orm/core';

describe('MemoryCacheAdapter', () => {

  test('should ignore old cache', async () => {
    vi.useFakeTimers();

    const cache = new MemoryCacheAdapter({ expiration: 10 });
    cache.set('cache-test-handle-1', 123, '');
    expect(cache.get('cache-test-handle-1')).toBe(123);
    vi.advanceTimersByTime(10);
    expect(cache.get('cache-test-handle-1')).toBe(123);

    vi.advanceTimersByTime(1);

    expect(cache.get('cache-test-handle-1')).toBeUndefined();
    cache.clear();

    vi.useRealTimers();
  });

});
