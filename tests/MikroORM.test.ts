import { MikroORM, Options, EntityManager } from '../lib';

describe('MikroORM', () => {

  test('should throw when no db name provided', async () => {
    await expect(MikroORM.init({ entitiesDirs: ['entities'] } as Options)).rejects.toEqual(new Error('No database specified, please fill in `dbName` option'));
  });

  test('should init itself with entity manager', async () => {
    const orm = await MikroORM.init({
      entitiesDirs: ['entities'],
      dbName: 'mikro-orm-test',
      baseDir: __dirname,
    });

    expect(orm).toBeInstanceOf(MikroORM);
    expect(orm.em).toBeInstanceOf(EntityManager);
    expect(orm.isConnected()).toBe(true);

    await orm.close();
    expect(orm.isConnected()).toBe(false);
  });

});
