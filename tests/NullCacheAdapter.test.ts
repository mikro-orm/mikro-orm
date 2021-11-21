import { NullCacheAdapter } from '@mikro-orm/core';
import { TEMP_DIR } from './helpers';

describe('NullCacheAdapter', () => {

  test('should ignore old cache', async () => {
    const origin = TEMP_DIR + '/.origin';
    const cache = new NullCacheAdapter();
    await cache.set('cache-test-handle', 123, origin);
    await expect(cache.get('cache-test-handle')).resolves.toBeNull();
    await cache.clear();
  });

});
