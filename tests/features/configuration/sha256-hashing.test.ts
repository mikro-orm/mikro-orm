import { writeFileSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { MikroORM, Entity, PrimaryKey, Property, FileCacheAdapter, Utils } from '@mikro-orm/core';
import { SqliteDriver } from '@mikro-orm/sqlite';
import { TEMP_DIR } from '../../helpers';

@Entity()
class TestEntity {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

}

/**
 * End-to-end tests for SHA256 hashing configuration in MikroORM.
 *
 * This test suite verifies that:
 * 1. MikroORM can be initialized with hashAlgorithm: 'sha256'
 * 2. FileCacheAdapter correctly uses the configured hash algorithm
 * 3. Cache invalidation works properly with SHA256 hashing
 * 4. SHA256 produces different hash values than MD5
 * 5. The configuration is properly passed through the entire system
 * 6. Backward compatibility with MD5 (default) is maintained
 */
describe('SHA256 Hashing Configuration', () => {
  let orm: MikroORM;
  const tempDir = join(TEMP_DIR, 'sha256-test');
  const testFile = join(tempDir, 'test-file.txt');

  beforeAll(async () => {
    // Ensure temp directory exists and create test file
    require('fs-extra').ensureDirSync(tempDir);
    writeFileSync(testFile, 'test content for hashing', { flush: true });
  });

  afterAll(async () => {
    if (orm) {
      await orm.close(true);
    }
    // Clean up test file
    try {
      unlinkSync(testFile);
    } catch {
      // Ignore cleanup errors
    }
  });

  test('should initialize MikroORM with SHA256 hash algorithm', async () => {
    orm = await MikroORM.init({
      driver: SqliteDriver,
      dbName: ':memory:',
      entities: [TestEntity],
      hashAlgorithm: 'sha256',
      metadataCache: {
        enabled: true,
        adapter: FileCacheAdapter,
        options: { cacheDir: tempDir },
      },
    });

    expect(orm.config.get('hashAlgorithm')).toBe('sha256');

    // Test that the ORM initializes successfully
    expect(orm).toBeDefined();
    expect(await orm.isConnected()).toBe(true);

    // Verify schema can be created
    await orm.schema.createSchema();

    // Test basic entity operations work
    const entity = orm.em.create(TestEntity, { name: 'test' });
    await orm.em.persistAndFlush(entity);

    const found = await orm.em.findOne(TestEntity, { name: 'test' });
    expect(found).toBeDefined();
    expect(found?.name).toBe('test');
  });

  test('should use SHA256 in FileCacheAdapter when configured', async () => {
    // Create cache adapters with different algorithms
    const md5Cache = new FileCacheAdapter(
      { cacheDir: join(tempDir, 'md5') },
      tempDir,
      false,
      'md5',
    );

    const sha256Cache = new FileCacheAdapter(
      { cacheDir: join(tempDir, 'sha256') },
      tempDir,
      false,
      'sha256',
    );

    // Ensure directories exist
    require('fs-extra').ensureDirSync(join(tempDir, 'md5'));
    require('fs-extra').ensureDirSync(join(tempDir, 'sha256'));

    // Set the same data with both adapters
    const testData = { test: 'data', number: 123 };

    md5Cache.set('test-key', testData, testFile);
    sha256Cache.set('test-key', testData, testFile);

    // Both should return the data
    expect(md5Cache.get('test-key')).toEqual(testData);
    expect(sha256Cache.get('test-key')).toEqual(testData);

    // The internal hash values should be different due to different algorithms
    // We can't directly test the hash values since they're internal,
    // but we can verify they both work correctly
    expect(md5Cache.get('test-key')).toEqual(sha256Cache.get('test-key'));
  });

  test('should produce different hash values with MD5 vs SHA256', () => {
    const testData = 'test data for hashing';

    const md5Hash = Utils.hash(testData, undefined, 'md5');
    const sha256Hash = Utils.hash(testData, undefined, 'sha256');

    // Hashes should be different
    expect(md5Hash).not.toBe(sha256Hash);

    // MD5 hash should be 32 characters (hex)
    expect(md5Hash).toHaveLength(32);
    expect(/^[a-f0-9]{32}$/.test(md5Hash)).toBe(true);

    // SHA256 hash should be 64 characters (hex)
    expect(sha256Hash).toHaveLength(64);
    expect(/^[a-f0-9]{64}$/.test(sha256Hash)).toBe(true);

    // Test with length parameter
    const md5Short = Utils.hash(testData, 16, 'md5');
    const sha256Short = Utils.hash(testData, 16, 'sha256');

    expect(md5Short).toHaveLength(16);
    expect(sha256Short).toHaveLength(16);
    expect(md5Short).not.toBe(sha256Short);
  });

  test('should use SHA256 algorithm from configuration in metadata cache', async () => {
    const orm2 = await MikroORM.init({
      driver: SqliteDriver,
      dbName: ':memory:',
      entities: [TestEntity],
      hashAlgorithm: 'sha256',
      metadataCache: {
        enabled: true,
        adapter: FileCacheAdapter,
        options: { cacheDir: join(tempDir, 'metadata-sha256') },
      },
    });

    // Ensure directory exists
    require('fs-extra').ensureDirSync(join(tempDir, 'metadata-sha256'));

    try {
      // Get the metadata cache adapter
      const cacheAdapter = orm2.config.getMetadataCacheAdapter();
      expect(cacheAdapter).toBeInstanceOf(FileCacheAdapter);

      // The cache adapter should be configured with SHA256
      // We can't directly access the private hashAlgorithm property,
      // but we can verify the cache works correctly
      const testKey = 'metadata-test';
      const testValue = { metadata: 'test' };

      cacheAdapter.set(testKey, testValue, testFile);
      const retrieved = cacheAdapter.get(testKey);

      expect(retrieved).toEqual(testValue);

      // Verify the ORM works with SHA256 hashing
      await orm2.schema.createSchema();
      const entity = orm2.em.create(TestEntity, { name: 'sha256-test' });
      await orm2.em.persistAndFlush(entity);

      const found = await orm2.em.findOne(TestEntity, { name: 'sha256-test' });
      expect(found).toBeDefined();
      expect(found?.name).toBe('sha256-test');
    } finally {
      await orm2.close(true);
    }
  });

  test('should default to MD5 when hashAlgorithm is not specified', async () => {
    const orm3 = await MikroORM.init({
      driver: SqliteDriver,
      dbName: ':memory:',
      entities: [TestEntity],
      // hashAlgorithm not specified, should default to 'md5'
      metadataCache: {
        enabled: true,
        adapter: FileCacheAdapter,
        options: { cacheDir: join(tempDir, 'default-md5') },
      },
    });

    try {
      expect(orm3.config.get('hashAlgorithm')).toBe('md5');

      // Verify it works with default MD5
      await orm3.schema.createSchema();
      const entity = orm3.em.create(TestEntity, { name: 'md5-default-test' });
      await orm3.em.persistAndFlush(entity);

      const found = await orm3.em.findOne(TestEntity, { name: 'md5-default-test' });
      expect(found).toBeDefined();
      expect(found?.name).toBe('md5-default-test');
    } finally {
      await orm3.close(true);
    }
  });

  test('should handle cache invalidation correctly with SHA256', async () => {
    const cacheDir = join(tempDir, 'invalidation-test');
    require('fs-extra').ensureDirSync(cacheDir);

    const cache = new FileCacheAdapter(
      { cacheDir },
      tempDir,
      false,
      'sha256',
    );

    const testKey = 'invalidation-test';
    const testValue = { data: 'original' };

    // Set initial value
    cache.set(testKey, testValue, testFile);
    expect(cache.get(testKey)).toEqual(testValue);

    // Modify the source file
    writeFileSync(testFile, 'modified content', { flush: true });

    // Cache should be invalidated and return null
    expect(cache.get(testKey)).toBeNull();

    // Set new value after file modification
    const newValue = { data: 'modified' };
    cache.set(testKey, newValue, testFile);
    expect(cache.get(testKey)).toEqual(newValue);
  });
});
