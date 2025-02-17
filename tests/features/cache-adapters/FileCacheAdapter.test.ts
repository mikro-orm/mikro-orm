import { writeFileSync } from 'node:fs';
import { FileCacheAdapter, Utils } from '@mikro-orm/core';
import { TEMP_DIR } from '../../helpers.js';

describe('FileCacheAdapter', () => {
  const tempdir = TEMP_DIR + '/foo';

  beforeAll(async () => {
    Utils.ensureDir(tempdir);
  });

  test('should ignore old cache', async () => {
    const origin = tempdir + '/.origin';
    const cache = new FileCacheAdapter({ cacheDir: tempdir }, tempdir);
    writeFileSync(origin, '123', { flush: true });
    cache.set('cache-test-handle-1', 123, origin);
    expect(cache.get('cache-test-handle-1')).toBe(123);

    writeFileSync(origin, '321', { flush: true });
    expect(cache.get('cache-test-handle-1')).toBeNull();

    cache.set('cache-test-handle-1', 123, origin);
    expect(cache.get('cache-test-handle-1')).toBe(123);
    cache.remove('cache-test-handle-1');
    expect(cache.get('cache-test-handle-1')).toBeNull();

    cache.clear();
  });

  test('should ignore if cached origin not found on file system', async () => {
    const cache = new FileCacheAdapter({ cacheDir: tempdir }, tempdir);
    cache.set('cache-test-handle-2', 123, 'not-existing-path');
    expect(cache.get('cache-test-handle-2')).toBeNull();
    cache.clear();
  });

});
