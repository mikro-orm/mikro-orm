import { NullCacheAdapter } from '../lib/cache';
import { TEMP_DIR } from './bootstrap';

/**
 * @class FileCacheAdapterTest
 */
describe('NullCacheAdapter', () => {

  test('should ignore old cache', async () => {
    const origin = TEMP_DIR + '/.origin';
    const cache = new NullCacheAdapter();
    await cache.set('cache-test-handle', 123, origin);
    await expect(cache.get('cache-test-handle')).resolves.toBeNull();
  });

});
