import { writeFileSync } from 'fs';
import { FileCacheAdapter } from '../lib/cache';
import { TEMP_DIR } from './bootstrap';

describe('FileCacheAdapter', () => {

  test('should ignore old cache', async () => {
    const origin = TEMP_DIR + '/.origin';
    const cache = new FileCacheAdapter({ cacheDir: TEMP_DIR });
    writeFileSync(origin, 123);
    await cache.set('cache-test-handle', 123, origin);
    await expect(cache.get('cache-test-handle')).resolves.toBe(123);

    await new Promise(resolve => setTimeout(resolve, 10));
    writeFileSync(origin, '321');
    await expect(cache.get('cache-test-handle')).resolves.toBeNull();
    await cache.clear();
  });

});
