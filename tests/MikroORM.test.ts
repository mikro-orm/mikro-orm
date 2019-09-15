import { MikroORM, EntityManager, Configuration, SchemaGenerator } from '../lib';
import { Author } from './entities';
import { BASE_DIR } from './bootstrap';
import { FooBaz2 } from './entities-sql';

describe('MikroORM', () => {

  test('should throw when not enough config provided', async () => {
    expect(() => new MikroORM({ entitiesDirs: ['entities'], dbName: '' })).toThrowError('No database specified, please fill in `dbName` option');
    expect(() => new MikroORM({ entities: [], entitiesDirs: [], dbName: 'test' })).toThrowError('No entities found, please use `entities` or `entitiesDirs` option');
    expect(() => new MikroORM({ dbName: 'test', entities: [Author], clientUrl: 'test' })).not.toThrowError();
    expect(() => new MikroORM({ dbName: 'test', entitiesDirs: ['entities'], clientUrl: 'test' })).not.toThrowError();
  });

  test('should work with Configuration object instance', async () => {
    expect(() => new MikroORM(new Configuration({ dbName: 'test', entities: [Author], clientUrl: 'test' }))).not.toThrowError();
    expect(() => new MikroORM(new Configuration({ dbName: 'test', entitiesDirs: ['entities'], clientUrl: 'test' }))).not.toThrowError();
  });

  test('should throw when TS entity directory does not exist', async () => {
    let error = /Path .*\/entities-invalid does not exist/;
    await expect(MikroORM.init({ dbName: 'test', baseDir: BASE_DIR, entities: [FooBaz2], cache: { enabled: false }, entitiesDirsTs: ['entities-invalid'] })).rejects.toThrowError(error);
    error = /Source file for entity .* not found, check your 'entitiesDirsTs' option/;
    await expect(MikroORM.init({ dbName: 'test', baseDir: BASE_DIR, entities: [FooBaz2], cache: { enabled: false }, entitiesDirsTs: ['entities'] })).rejects.toThrowError(error);
  });

  test('should throw when no entity discovered', async () => {
    await expect(MikroORM.init({ dbName: 'test', entitiesDirs: ['not-existing/path'] })).rejects.toThrowError('No entities were discovered');
  });

  test('should throw when multiple entities with same file name discovered', async () => {
    await expect(MikroORM.init({ dbName: 'test', baseDir: BASE_DIR, cache: { enabled: false }, entitiesDirs: ['entities-1', 'entities-2'] })).rejects.toThrowError('Duplicate entity names are not allowed: Dup1, Dup2');
  });

  test('should throw when multiple entities with same class name discovered', async () => {
    await expect(MikroORM.init({ dbName: 'test', baseDir: BASE_DIR, cache: { enabled: false }, entitiesDirs: ['entities-3'] })).rejects.toThrowError(`Entity 'BadName' not found in ./entities-3/bad-name.model.ts`);
  });

  test('should load itself with entity manager', async () => {
    const orm = await MikroORM.init({
      entitiesDirs: ['entities'],
      dbName: 'mikro-orm-test',
      baseDir: __dirname,
    });

    expect(orm).toBeInstanceOf(MikroORM);
    expect(orm.em).toBeInstanceOf(EntityManager);
    expect(Object.keys(orm.getMetadata().getAll()).sort()).toEqual(['Author', 'Book', 'BookTag', 'FooBar', 'FooBaz', 'Publisher', 'Test']);
    expect(await orm.isConnected()).toBe(true);

    await orm.close();
    expect(await orm.isConnected()).toBe(false);
  });

});
