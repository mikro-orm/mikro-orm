import type { MikroORM } from '@mikro-orm/core';
import type { MongoDriver } from '@mikro-orm/mongodb';
import { MongoSchemaGenerator } from '@mikro-orm/mongodb';
import { initORMMongo } from '../../bootstrap';
import FooBar from '../../entities/FooBar';
import { FooBaz } from '../../entities/FooBaz';

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
  });

  test('refresh collections', async () => {
    const createCollection = jest.spyOn(MongoSchemaGenerator.prototype, 'createSchema');
    const dropCollections = jest.spyOn(MongoSchemaGenerator.prototype, 'dropSchema');

    createCollection.mockResolvedValue();
    dropCollections.mockResolvedValue();

    await orm.schema.refreshDatabase();

    expect(dropCollections).toBeCalledTimes(1);
    expect(createCollection).toBeCalledTimes(1);

    await orm.schema.refreshDatabase({ ensureIndexes: false });

    expect(dropCollections).toBeCalledTimes(2);
    expect(createCollection).toBeCalledTimes(2);

    createCollection.mockRestore();
    dropCollections.mockRestore();
  });

  test('updateSchema just forwards to createSchema', async () => {
    const spy = jest.spyOn(MongoSchemaGenerator.prototype, 'createSchema');
    spy.mockImplementation();
    await orm.schema.updateSchema();
    expect(spy).toBeCalledTimes(1);
    spy.mockRestore();
  });

  test('ensureIndexes also recreates changed indexes and removes not defined ones', async () => {
    const dropIndexesSpy = jest.spyOn(MongoSchemaGenerator.prototype, 'dropIndexes');
    const ensureIndexesSpy = jest.spyOn(MongoSchemaGenerator.prototype, 'ensureIndexes');
    const meta = orm.getMetadata(FooBaz);
    meta.properties.name.nullable = false;
    await orm.schema.ensureIndexes();
    meta.properties.name.nullable = true;
    await orm.schema.ensureIndexes();

    expect(dropIndexesSpy).toBeCalledWith(
      expect.objectContaining({
      collectionsWithFailedIndexes: ['foo-baz'],
    }));

    expect(ensureIndexesSpy).toBeCalledTimes(3);

    dropIndexesSpy.mockRestore();
    ensureIndexesSpy.mockRestore();
  });

  test('deprecated driver methods that are now in MongoSchemaGenerator', async () => {
    const driver = orm.em.getDriver();
    const createSchemaSpy = jest.spyOn(MongoSchemaGenerator.prototype, 'createSchema');
    const dropSchemaSpy = jest.spyOn(MongoSchemaGenerator.prototype, 'dropSchema');
    const refreshDatabaseSpy = jest.spyOn(MongoSchemaGenerator.prototype, 'refreshDatabase');
    const ensureIndexesSpy = jest.spyOn(MongoSchemaGenerator.prototype, 'ensureIndexes');
    createSchemaSpy.mockImplementation();
    dropSchemaSpy.mockImplementation();
    refreshDatabaseSpy.mockImplementation();

    await driver.createCollections();
    expect(createSchemaSpy).toBeCalledTimes(1);

    await driver.dropCollections();
    expect(dropSchemaSpy).toBeCalledTimes(1);

    await driver.refreshCollections();
    expect(refreshDatabaseSpy).toBeCalledTimes(1);

    await driver.ensureIndexes();
    expect(ensureIndexesSpy).toBeCalledTimes(1);

    createSchemaSpy.mockRestore();
    dropSchemaSpy.mockRestore();
    refreshDatabaseSpy.mockRestore();
    ensureIndexesSpy.mockRestore();
  });

});
