// Schema create/update must not break when a view definition contains SQL
// comments. A `-- comment` followed by a blank line used to split the view DDL
// into two invalid statements (blank lines act as statement separators), and
// collapsing newlines made the comment swallow the rest of the definition.

import { defineEntity, MikroORM, p } from '@mikro-orm/postgresql';

const User = defineEntity({
  name: 'User7875',
  tableName: 'user7875',
  properties: {
    id: p.integer().primary().autoincrement(),
    name: p.string(),
  },
});

const UserView = defineEntity({
  name: 'UserView7875',
  tableName: 'user7875_view',
  view: true,
  expression: `
    WITH data AS (SELECT id, name FROM user7875)
    -- comment about the view

    SELECT id, name FROM data
  `,
  properties: {
    id: p.integer().primary(),
    name: p.string(),
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: 'mikro_orm_test_gh7875',
    entities: [User, UserView],
  });
  await orm.schema.drop();
});

afterAll(async () => {
  await orm.close(true);
});

test('schema create/update works with views containing SQL comments', async () => {
  const createSql = await orm.schema.getCreateSchemaSQL();
  expect(createSql).toContain('create view "user7875_view"');
  expect(createSql).not.toContain('-- comment about the view');

  await expect(orm.schema.create()).resolves.toBeUndefined();

  // a no-op update should detect no changes (comment must not cause churn)
  const diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
  expect(diff).toBe('');

  // executing the generated create SQL directly must also work
  await orm.schema.drop();
  await expect(orm.em.execute(createSql)).resolves.toBeDefined();
});
