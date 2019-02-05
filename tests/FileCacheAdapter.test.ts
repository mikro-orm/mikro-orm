import { writeFileSync } from 'fs';
import { FileCacheAdapter } from '../lib/cache/FileCacheAdapter';
import { TEMP_DIR } from './bootstrap';

/**
 * @class FileCacheAdapterTest
 */
describe('FileCacheAdapter', () => {

  test('should ignore old cache', async () => {
    const origin = TEMP_DIR + '/.origin';
    const cache = new FileCacheAdapter({ cacheDir: TEMP_DIR });
    writeFileSync(origin, 123);
    cache.set('cache-test-handle', 123, origin);
    expect(cache.get('cache-test-handle')).toBe(123);

    writeFileSync(origin, '321');
    expect(cache.get('cache-test-handle')).toBeNull();
  });

});
