import { NullCacheAdapter } from '@mikro-orm/core';
import { TEMP_DIR } from '../../helpers.js';

describe('NullCacheAdapter', () => {

  test('should ignore old cache', async () => {
    const origin = TEMP_DIR + '/.origin';
    const cache = new NullCacheAdapter();
    cache.set('cache-test-handle', 123, origin);
    expect(cache.get('cache-test-handle')).toBeNull();
    cache.remove('cache-test-handle');
    expect(cache.get('cache-test-handle')).toBeNull();
    cache.clear();
  });

});
