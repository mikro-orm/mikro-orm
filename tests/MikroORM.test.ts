import { MikroORM, Options, EntityManager } from '../lib';

/**
 * @class MikroORMTest
 */
describe('MikroORM', () => {

  test('should throw when not enough options provided', async () => {
    await expect(() => new MikroORM({ entitiesDirs: ['entities'] } as Options)).toThrowError('No database specified, please fill in `dbName` option');
    await expect(() => new MikroORM({ dbName: 'test' } as Options)).toThrowError('No directories for entity discovery specified, please fill in `entitiesDirs` option');
    await expect(() => new MikroORM({ dbName: 'test', entitiesDirs: ['entities'], clientUrl: 'test' } as Options)).not.toThrowError();
  });

  test('should init itself with entity manager', async () => {
    const orm = await MikroORM.init({
      entitiesDirs: ['entities'],
      dbName: 'mikro-orm-test',
      baseDir: __dirname,
      logger: (): void => null,
    });

    expect(orm).toBeInstanceOf(MikroORM);
    expect(orm.em).toBeInstanceOf(EntityManager);
    expect(orm.isConnected()).toBe(true);

    await orm.close();
    expect(orm.isConnected()).toBe(false);
  });

});
