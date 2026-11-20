import { defineEntity, p } from '@mikro-orm/core';
import { MikroORM as MsSqlMikroORM } from '@mikro-orm/mssql';
import { MikroORM as MySqlMikroORM } from '@mikro-orm/mysql';
import { MikroORM as PostgreSqlMikroORM } from '@mikro-orm/postgresql';

const Widget = defineEntity({
  name: 'Widget',
  tableName: 'otherdb.dbo.widgets',
  properties: {
    id: p.integer().primary(),
    name: p.string(),
  },
});

test('three-part table name is quoted per part in mssql', async () => {
  const orm = new MsSqlMikroORM({ entities: [Widget], dbName: 'mikro_orm_test_gh8760' });

  const select = orm.em.createQueryBuilder(Widget, 'w').select('*').where({ id: 1 });
  expect(select.getFormattedQuery()).toBe('select [w].* from [otherdb].[dbo].[widgets] as [w] where [w].[id] = 1');

  const insert = orm.em.createQueryBuilder(Widget).insert({ id: 1, name: 'foo' });
  expect(insert.getFormattedQuery()).toBe(
    'set identity_insert [otherdb].[dbo].[widgets] on; ' +
      "insert into [otherdb].[dbo].[widgets] ([id], [name]) values (1, N'foo'); " +
      'select @@rowcount; ' +
      'set identity_insert [otherdb].[dbo].[widgets] off;',
  );

  await orm.close();
});

test('three-part table name is quoted per part in postgres', async () => {
  const orm = new PostgreSqlMikroORM({ entities: [Widget], dbName: 'mikro_orm_test_gh8760' });

  const select = orm.em.createQueryBuilder(Widget, 'w').select('*').where({ id: 1 });
  expect(select.getFormattedQuery()).toBe('select "w".* from "otherdb"."dbo"."widgets" as "w" where "w"."id" = 1');

  await orm.close();
});

test('three-part table name is quoted per part in mysql', async () => {
  const orm = new MySqlMikroORM({ entities: [Widget], dbName: 'mikro_orm_test_gh8760' });

  const select = orm.em.createQueryBuilder(Widget, 'w').select('*').where({ id: 1 });
  expect(select.getFormattedQuery()).toBe('select `w`.* from `otherdb`.`dbo`.`widgets` as `w` where `w`.`id` = 1');

  await orm.close();
});
