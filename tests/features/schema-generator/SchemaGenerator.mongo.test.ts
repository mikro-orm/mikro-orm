import type { MikroORM } from '@mikro-orm/core';
import type { MongoDriver } from '@mikro-orm/mongodb';
import { MongoSchemaGenerator } from '@mikro-orm/mongodb';
import FooBar from '../../entities/FooBar';
import { initORMMongo } from '../../bootstrap';

describe('SchemaGenerator', () => {

  let orm: MikroORM<MongoDriver>;

  beforeAll(async () => orm = await initORMMongo());
  afterAll(async () => await orm.close(true));
  beforeEach(async () => orm.getSchemaGenerator().clearDatabase());

  test('create/drop collection', async () => {
    const driver = orm.em.getDriver();
    await driver.getConnection().dropCollection(FooBar);
    let collections = await driver.getConnection().listCollections();
    expect(collections).not.toContain('foo-bar');
    await orm.getSchemaGenerator().createSchema();
    collections = await driver.getConnection().listCollections();
    expect(collections).toContain('foo-bar');
  });

  test('refresh collections', async () => {
    const createCollection = jest.spyOn(MongoSchemaGenerator.prototype, 'createSchema');
    const dropCollections = jest.spyOn(MongoSchemaGenerator.prototype, 'dropSchema');
    const ensureIndexes = jest.spyOn(MongoSchemaGenerator.prototype, 'ensureIndexes');

    createCollection.mockResolvedValue();
    dropCollections.mockResolvedValue();
    ensureIndexes.mockResolvedValue();

    await orm.getSchemaGenerator().refreshDatabase();

    expect(dropCollections).toBeCalledTimes(1);
    expect(createCollection).toBeCalledTimes(1);
    expect(ensureIndexes).toBeCalledTimes(1);

    await orm.getSchemaGenerator().refreshDatabase({ ensureIndexes: false });

    expect(dropCollections).toBeCalledTimes(2);
    expect(createCollection).toBeCalledTimes(2);
    expect(ensureIndexes).toBeCalledTimes(1);

    createCollection.mockRestore();
    dropCollections.mockRestore();
    ensureIndexes.mockRestore();
  });

  test('updateSchema just forwards to createSchema', async () => {
    const spy = jest.spyOn(MongoSchemaGenerator.prototype, 'createSchema');
    spy.mockImplementation();
    await orm.getSchemaGenerator().updateSchema();
    expect(spy).toBeCalledTimes(1);
    spy.mockRestore();
  });

  test('ensureIndexes also recreates changed indexes and removes not defined ones', async () => {
    const meta = orm.getMetadata().get('Author');
    meta.properties.born.nullable = false;
    await orm.getSchemaGenerator().ensureIndexes();
    meta.properties.born.nullable = true;
    await orm.getSchemaGenerator().ensureIndexes();
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
