import type { MikroORM } from '@mikro-orm/core';
import type { MongoDriver } from '@mikro-orm/mongodb';
import { MongoSchemaGenerator } from '@mikro-orm/mongodb';
import { initORMMongo } from '../../bootstrap.js';
import FooBar from '../../entities/FooBar.js';
import { FooBaz } from '../../entities/FooBaz.js';

describe('SchemaGenerator', () => {

  let orm: MikroORM<MongoDriver>;

  beforeAll(async () => orm = await initORMMongo());
  afterAll(async () => await orm.close(true));
  beforeEach(async () => orm.schema.clearDatabase());

  test('create/drop collection', async () => {
    const driver = orm.em.getDriver();
    await driver.getConnection().dropCollection(FooBar);
    let collections = await driver.getConnection().listCollections();
    expect(collections).not.toContain('foo-bar');
    await orm.schema.createSchema();
    collections = await driver.getConnection().listCollections();
    expect(collections).toContain('foo-bar');
    await orm.schema.dropSchema({ dropMigrationsTable: true });
    collections = await driver.getConnection().listCollections();
    expect(collections).toHaveLength(0);
  });

  test('refresh collections', async () => {
    const createCollection = vi.spyOn(MongoSchemaGenerator.prototype, 'createSchema');
    const dropCollections = vi.spyOn(MongoSchemaGenerator.prototype, 'dropSchema');

    createCollection.mockResolvedValue();
    dropCollections.mockResolvedValue();

    await orm.schema.refreshDatabase();

    expect(dropCollections).toHaveBeenCalledTimes(1);
    expect(createCollection).toHaveBeenCalledTimes(1);

    await orm.schema.refreshDatabase({ ensureIndexes: false });

    expect(dropCollections).toHaveBeenCalledTimes(2);
    expect(createCollection).toHaveBeenCalledTimes(2);

    createCollection.mockRestore();
    dropCollections.mockRestore();
  });

  test('updateSchema just forwards to createSchema', async () => {
    const spy = vi.spyOn(MongoSchemaGenerator.prototype, 'createSchema');
    spy.mockImplementation(async o => void 0);
    await orm.schema.updateSchema();
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });

  test('ensureIndexes also recreates changed indexes and removes not defined ones', async () => {
    const dropIndexesSpy = vi.spyOn(MongoSchemaGenerator.prototype, 'dropIndexes');
    const ensureIndexesSpy = vi.spyOn(MongoSchemaGenerator.prototype, 'ensureIndexes');
    const meta = orm.getMetadata(FooBaz);
    meta.properties.name.nullable = false;
    await orm.schema.ensureIndexes();
    meta.properties.name.nullable = true;
    await orm.schema.ensureIndexes();

    expect(dropIndexesSpy).toHaveBeenCalledWith(
      expect.objectContaining({
      collectionsWithFailedIndexes: ['foo-baz'],
    }));

    expect(ensureIndexesSpy).toHaveBeenCalledTimes(3);

    dropIndexesSpy.mockRestore();
    ensureIndexesSpy.mockRestore();
  });

});
