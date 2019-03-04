import { NullCacheAdapter } from '../lib/cache/NullCacheAdapter';
import { TEMP_DIR } from './bootstrap';

/**
 * @class FileCacheAdapterTest
 */
describe('NullCacheAdapter', () => {

  test('should ignore old cache', async () => {
    const origin = TEMP_DIR + '/.origin';
    const cache = new NullCacheAdapter();
    cache.set('cache-test-handle', 123, origin);
    expect(cache.get('cache-test-handle')).toBeNull();
  });

});
