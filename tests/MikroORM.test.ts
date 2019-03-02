import { MikroORM, EntityManager } from '../lib';

/**
 * @class MikroORMTest
 */
describe('MikroORM', () => {

  test('should throw when not enough options provided', async () => {
    expect(() => new MikroORM({ entitiesDirs: ['entities'], dbName: '' })).toThrowError('No database specified, please fill in `dbName` option');
    expect(() => new MikroORM({ entitiesDirs: [], dbName: 'test' })).toThrowError('No directories for entity discovery specified, please fill in `entitiesDirs` option');
    expect(() => new MikroORM({ dbName: 'test', entitiesDirs: ['entities'], clientUrl: 'test' })).not.toThrowError();
  });

  test('should throw when TS entity directory does not exist', async () => {
    const error = /Path .*\/entities-invalid does not exist/;
    await expect(MikroORM.init({ dbName: 'test', entitiesDirs: ['entities'], entitiesDirsTs: ['entities-invalid'] })).rejects.toThrowError(error);
  });

  test('should init itself with entity manager', async () => {
    const orm = await MikroORM.init({
      entitiesDirs: ['entities'],
      dbName: 'mikro-orm-test',
      baseDir: __dirname,
    });

    expect(orm).toBeInstanceOf(MikroORM);
    expect(orm.em).toBeInstanceOf(EntityManager);
    expect(await orm.isConnected()).toBe(true);

    await orm.close();
    expect(await orm.isConnected()).toBe(false);
  });

});
