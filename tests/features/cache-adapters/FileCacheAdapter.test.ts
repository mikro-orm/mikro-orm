import { writeFileSync } from 'fs';
import { FileCacheAdapter } from '@mikro-orm/core';
import { TEMP_DIR } from '../../helpers';

describe('FileCacheAdapter', () => {

  test('should ignore old cache', async () => {
    const origin = TEMP_DIR + '/.origin';
    const cache = new FileCacheAdapter({ cacheDir: TEMP_DIR }, TEMP_DIR);
    writeFileSync(origin, '123');
    cache.set('cache-test-handle-1', 123, origin);
    await expect(cache.get('cache-test-handle-1')).toBe(123);

    await new Promise(resolve => setTimeout(resolve, 10));
    writeFileSync(origin, '321');
    await expect(cache.get('cache-test-handle-1')).toBeNull();

    cache.set('cache-test-handle-1', 123, origin);
    await expect(cache.get('cache-test-handle-1')).toBe(123);
    cache.remove('cache-test-handle-1');
    await expect(cache.get('cache-test-handle-1')).toBeNull();

    cache.clear();
  });

  test('should ignore if cached origin not found on file system', async () => {
    const cache = new FileCacheAdapter({ cacheDir: TEMP_DIR }, TEMP_DIR);
    cache.set('cache-test-handle-2', 123, 'not-existing-path');
    expect(cache.get('cache-test-handle-2')).toBeNull();
    cache.clear();
  });

});
