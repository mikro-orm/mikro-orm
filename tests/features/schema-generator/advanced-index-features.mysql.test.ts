import { defineEntity, MikroORM, MySqlSchemaHelper, p, type IndexDef } from '@mikro-orm/mysql';

class TestEntity {
  id!: number;
  name!: string;
  email!: string;
  content!: string;
  createdAt!: Date;
}

const TestEntity1 = defineEntity({
  class: TestEntity,
  tableName: 'adv_idx_mysql_entity',
  indexes: [
    {
      properties: ['createdAt', 'name'],
      columns: [
        { name: 'createdAt', sort: 'DESC' },
        { name: 'name', sort: 'ASC' },
      ],
    },
    {
      name: 'prefix_idx',
      properties: ['content'],
      columns: [{ name: 'content', length: 100 }],
    },
    {
      name: 'invisible_idx',
      properties: ['email'],
      invisible: true,
    },
    {
      name: 'collation_idx',
      properties: ['name'],
      columns: [{ name: 'name', collation: 'utf8mb4_unicode_ci' }],
    },
  ],
  properties: {
    id: p.integer().primary(),
    name: p.string(),
    email: p.string(),
    content: p.text(),
    createdAt: p.datetime(),
  },
});

const TestEntity2 = defineEntity({
  class: TestEntity,
  tableName: 'adv_idx_mysql_entity',
  indexes: [
    {
      properties: ['createdAt', 'name'],
      columns: [
        { name: 'createdAt', sort: 'ASC' },
        { name: 'name', sort: 'DESC' },
      ],
    },
    {
      name: 'prefix_idx',
      properties: ['content'],
      columns: [{ name: 'content', length: 50 }],
    },
    {
      name: 'invisible_idx',
      properties: ['email'],
      invisible: false,
    },
  ],
  properties: {
    id: p.integer().primary(),
    name: p.string(),
    email: p.string(),
    content: p.text(),
    createdAt: p.datetime(),
  },
});

describe('advanced index features in mysql', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [TestEntity1],
      dbName: `mikro_orm_test_adv_idx_mysql`,
      port: 3308,
    });
    await orm.schema.refresh();
  });

  afterAll(() => orm.close(true));

  test('schema generator creates indexes with sort order, prefix length, invisible, and collation', async () => {
    const sql = await orm.schema.getCreateSchemaSQL({ wrap: false });
    expect(sql).toMatchSnapshot('create schema');

    expect(sql).toMatch(/`created_at` desc/i);
    expect(sql).toMatch(/`content`\(100\)/i);
    expect(sql).toMatch(/invisible/i);
    expect(sql).toMatch(/collate utf8mb4_unicode_ci/i);
  });

  test('schema generator diffs indexes with changed options', async () => {
    orm.discoverEntity(TestEntity2, TestEntity1);
    const diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('update schema');

    expect(diff).toMatch(/drop index.*collation_idx/i);
  });

  test('getIndexColumns handles collation with length and sort', async () => {
    const schemaHelper = orm.em.getDriver().getPlatform().getSchemaHelper()! as MySqlSchemaHelper;
    const index: IndexDef = {
      keyName: 'test_idx',
      columnNames: ['content'],
      columns: [
        {
          name: 'content',
          collation: 'utf8mb4_unicode_ci',
          length: 50,
          sort: 'DESC',
        },
      ],
      unique: false,
      primary: false,
      constraint: false,
    };

    const sql = schemaHelper.getCreateIndexSQL('test_table', index);
    expect(sql).toMatch(/\(`content`\(50\) collate utf8mb4_unicode_ci\) desc/i);
  });

  test('getCreateIndexSQL with invisible flag', async () => {
    const schemaHelper = orm.em.getDriver().getPlatform().getSchemaHelper()! as MySqlSchemaHelper;
    const index: IndexDef = {
      keyName: 'invisible_test_idx',
      columnNames: ['name'],
      unique: false,
      primary: false,
      constraint: false,
      invisible: true,
    };

    const sql = schemaHelper.getCreateIndexSQL('test_table', index);
    expect(sql).toMatch(/invisible/i);
  });

  test('schema comparator detects invisible flag change only', async () => {
    class InvisibleTestEntity {
      id!: number;
      name!: string;
    }

    const InvisibleTest1 = defineEntity({
      class: InvisibleTestEntity,
      tableName: 'invisible_change_test',
      indexes: [{ name: 'vis_idx', properties: ['name'], invisible: false }],
      properties: {
        id: p.integer().primary(),
        name: p.string(),
      },
    });

    const InvisibleTest2 = defineEntity({
      class: InvisibleTestEntity,
      tableName: 'invisible_change_test',
      indexes: [{ name: 'vis_idx', properties: ['name'], invisible: true }],
      properties: {
        id: p.integer().primary(),
        name: p.string(),
      },
    });

    const orm2 = await MikroORM.init({
      entities: [InvisibleTest1],
      dbName: `mikro_orm_test_adv_idx_mysql`,
      port: 3308,
    });

    await orm2.schema.execute('drop table if exists `invisible_change_test`');
    await orm2.schema.refresh();

    orm2.discoverEntity(InvisibleTest2, InvisibleTest1);
    const diff = await orm2.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatch(/drop index.*vis_idx/i);
    expect(diff).toMatch(/index.*vis_idx.*invisible/i);

    await orm2.schema.drop();
    await orm2.close();
  });
});
