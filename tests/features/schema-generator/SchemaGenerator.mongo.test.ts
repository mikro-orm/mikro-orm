import { MikroORM } from '@mikro-orm/core';

describe('SchemaGenerator', () => {

  test('not supported [mongodb]', async () => {
    const orm = await MikroORM.init({ type: 'mongo', dbName: 'mikro-orm-test', discovery: { warnWhenNoEntities: false } }, false);
    expect(() => orm.getSchemaGenerator()).toThrowError('MongoPlatform does not support SchemaGenerator');
  });

});
