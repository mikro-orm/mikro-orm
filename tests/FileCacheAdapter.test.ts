import { writeFileSync } from 'fs';
import { FileCacheAdapter } from '../lib/cache';
import { TEMP_DIR } from './bootstrap';

describe('FileCacheAdapter', () => {

  test('should ignore old cache', async () => {
    const origin = TEMP_DIR + '/.origin';
    const cache = new FileCacheAdapter({ cacheDir: TEMP_DIR }, TEMP_DIR);
    writeFileSync(origin, 123);
    await cache.set('cache-test-handle-1', 123, origin);
    await expect(cache.get('cache-test-handle-1')).resolves.toBe(123);

    await new Promise(resolve => setTimeout(resolve, 10));
    writeFileSync(origin, '321');
    await expect(cache.get('cache-test-handle-1')).resolves.toBeNull();
    await cache.clear();
  });

  test('should ignore if cached origin not found on file system', async () => {
    const cache = new FileCacheAdapter({ cacheDir: TEMP_DIR }, TEMP_DIR);
    await cache.set('cache-test-handle-2', 123, 'not-existing-path');
    await expect(cache.get('cache-test-handle-2')).resolves.toBeNull();
    await cache.clear();
  });

});
