import { MikroORM, EntityManager } from '../lib';

/**
 * @class MikroORMTest
 */
describe('MikroORM', () => {

  test('should throw when not enough options provided', async () => {
    await expect(() => new MikroORM({ entitiesDirs: ['entities'], dbName: '' })).toThrowError('No database specified, please fill in `dbName` option');
    await expect(() => new MikroORM({ entitiesDirs: [], dbName: 'test' })).toThrowError('No directories for entity discovery specified, please fill in `entitiesDirs` option');
    await expect(() => new MikroORM({ dbName: 'test', entitiesDirs: ['entities'], clientUrl: 'test' })).not.toThrowError();
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
