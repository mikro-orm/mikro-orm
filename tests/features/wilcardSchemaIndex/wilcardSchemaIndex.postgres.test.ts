import { MikroORM } from '@mikro-orm/core';
import { Author } from './entities/Author';
import { v4 } from 'uuid';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';

describe('wilcardSchemaIndex', () => {

  test('create SQL schema', async () => {

    const orm = await MikroORM.init({
      entities: [Author],
      dbName: `db-${v4()}`, // random db name
      port: 5432,
      driver: PostgreSqlDriver,
    });

    let createDump = await orm.schema.getCreateSchemaSQL({ schema: 'library1' });
    expect(createDump).toMatchSnapshot('createSchemaSQL-dump');
    await orm.schema.execute(createDump);

    createDump = await orm.schema.getCreateSchemaSQL({ schema: 'library2' });
    expect(createDump).toMatchSnapshot('createSchemaSQL-dump');
    await orm.schema.execute(createDump);

    await orm.schema.dropDatabase();
    await orm.close(true);
  });

});
