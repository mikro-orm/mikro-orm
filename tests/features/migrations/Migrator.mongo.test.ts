import { MikroORM } from '@mikro-orm/core';

describe('Migrator', () => {

  test('not supported [mongodb]', async () => {
    const orm = await MikroORM.init({ type: 'mongo', dbName: 'mikro-orm-test', discovery: { warnWhenNoEntities: false } }, false);
    expect(() => orm.getMigrator()).toThrowError('MongoPlatform does not support Migrator');
  });

});
