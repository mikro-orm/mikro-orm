import { EntitySchema, type MikroORM } from '@mikro-orm/core';
import { MikroORM as SqliteMikroORM } from '@mikro-orm/sqlite';
import { MikroORM as PostgreSqlMikroORM } from '@mikro-orm/postgresql';
import { MikroORM as MySqlMikroORM } from '@mikro-orm/mysql';

/**
 * Multi-line trigger bodies were broken in several ways:
 * - tab indentation and CRLF endings were kept by the comparator but stripped by the schema
 *   generator before execution, so the trigger was dropped and recreated on every schema update
 * - a blank line inside the body acted as a statement group separator, tearing the DDL apart
 */
function entity(tableName: string, columnType: string, body: string) {
  return new EntitySchema({
    name: 'Product',
    tableName,
    properties: {
      id: { primary: true, type: 'number', columnType },
      price: { type: 'number', columnType },
    },
    triggers: [{ name: `${tableName}_trg`, timing: 'before', events: ['insert'], body }],
  });
}

async function assertNoChurn(orm: MikroORM) {
  await orm.schema.refresh();
  expect(await orm.schema.getUpdateSchemaSQL({ wrap: false })).toBe('');
}

describe('GHx64 — multi-line trigger bodies', () => {
  describe('sqlite', () => {
    const table = 'ghx64_sqlite';
    const init = (body: string) =>
      SqliteMikroORM.init({ entities: [entity(table, 'integer', body)], dbName: ':memory:' });

    test('tab indented body does not produce a perpetual diff', async () => {
      const orm = await init(`update ${table}\n\tset price = price + 1\nwhere id = NEW.id`);
      await assertNoChurn(orm);
      await orm.close(true);
    });

    test('crlf body does not produce a perpetual diff', async () => {
      const orm = await init(`update ${table}\r\nset price = price + 1\r\nwhere id = NEW.id`);
      await assertNoChurn(orm);
      await orm.close(true);
    });

    test('blank line inside the body does not tear the DDL', async () => {
      const orm = await init(`update ${table}\n\nset price = price + 1\nwhere id = NEW.id`);
      await assertNoChurn(orm);
      await orm.close(true);
    });

    test('blank line after a statement does not tear the DDL', async () => {
      const orm = await init(`update ${table} set price = price + 1;\n\nupdate ${table} set price = price + 2`);
      await assertNoChurn(orm);
      await orm.close(true);
    });
  });

  describe('postgres', () => {
    const table = 'ghx64_postgres';
    const init = (body: string) =>
      PostgreSqlMikroORM.init({ entities: [entity(table, 'int', body)], dbName: 'mikro_orm_test_ghx64_pg' });

    test('tab indented body does not produce a perpetual diff', async () => {
      const orm = await init(`if (NEW.price is null) then\n\tNEW.price = 0;\nend if;\nreturn NEW`);
      await orm.schema.ensureDatabase();
      await assertNoChurn(orm);
      await orm.schema.dropDatabase();
      await orm.close(true);
    });

    test('blank line after a statement does not tear the DDL', async () => {
      const orm = await init(`NEW.price = coalesce(NEW.price, 0);\n\nreturn NEW`);
      await orm.schema.ensureDatabase();
      await assertNoChurn(orm);
      await orm.schema.dropDatabase();
      await orm.close(true);
    });
  });

  describe('mysql', () => {
    const table = 'ghx64_mysql';
    const init = (body: string) =>
      MySqlMikroORM.init({
        entities: [entity(table, 'int', body)],
        dbName: 'mikro_orm_test_ghx64_mysql',
        port: 3308,
      });

    test('tab indented body does not produce a perpetual diff', async () => {
      const orm = await init(`if (NEW.price is null) then\n\tset NEW.price = 0;\nend if`);
      await orm.schema.ensureDatabase();
      await assertNoChurn(orm);
      await orm.schema.dropDatabase();
      await orm.close(true);
    });

    test('blank line after a statement does not tear the DDL', async () => {
      const orm = await init(`set NEW.price = coalesce(NEW.price, 0);\n\nset NEW.price = NEW.price + 1`);
      await orm.schema.ensureDatabase();
      await assertNoChurn(orm);
      await orm.schema.dropDatabase();
      await orm.close(true);
    });
  });
});
