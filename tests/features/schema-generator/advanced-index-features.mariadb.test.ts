import { defineEntity, MikroORM, p } from '@mikro-orm/mariadb';

class TestEntity {
  id!: number;
  name!: string;
  email!: string;
  content!: string;
  createdAt!: Date;
}

const TestEntity1 = defineEntity({
  class: TestEntity,
  tableName: 'adv_idx_maria_entity',
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
  tableName: 'adv_idx_maria_entity',
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
  ],
  properties: {
    id: p.integer().primary(),
    name: p.string(),
    email: p.string(),
    content: p.text(),
    createdAt: p.datetime(),
  },
});

class AriaEntity {
  id!: number;
  sortKey!: number;
}

const AriaEntitySchema = defineEntity({
  class: AriaEntity,
  tableName: 'aria_table',
  comment: 'ENGINE=Aria',
  indexes: [
    {
      name: 'clustered_idx',
      properties: ['sortKey'],
      clustered: true,
    },
  ],
  properties: {
    id: p.integer().primary(),
    sortKey: p.integer(),
  },
});

describe('advanced index features in mariadb', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [TestEntity1],
      dbName: `mikro_orm_test_adv_idx_mariadb`,
      port: 3309,
    });
    await orm.schema.refresh();
  });

  afterAll(() => orm.close(true));

  test('schema generator creates indexes with sort order and prefix length', async () => {
    const sql = await orm.schema.getCreateSchemaSQL({ wrap: false });
    expect(sql).toMatchSnapshot('create schema');

    expect(sql).toMatch(/`created_at` desc/i);
    expect(sql).toMatch(/`content`\(100\)/i);
  });

  test('schema generator diffs indexes with changed options', async () => {
    orm.discoverEntity(TestEntity2, TestEntity1);
    const diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('update schema');

    expect(diff).toMatch(/drop index/i);
  });

  test('schema generator creates clustered index syntax', async () => {
    const orm2 = await MikroORM.init({
      entities: [AriaEntitySchema],
      dbName: `mikro_orm_test_adv_idx_mariadb`,
      port: 3309,
    });

    const sql = await orm2.schema.getCreateSchemaSQL({ wrap: false });
    expect(sql).toMatchSnapshot('clustered index');
    expect(sql).toMatch(/clustering=yes/i);

    await orm2.close();
  });

  test('schema generator uses IGNORED keyword instead of INVISIBLE', async () => {
    class IgnoredEntity {
      id!: number;
      name!: string;
    }

    const IgnoredEntitySchema = defineEntity({
      class: IgnoredEntity,
      tableName: 'ignored_idx_test',
      indexes: [
        {
          name: 'ignored_idx',
          properties: ['name'],
          invisible: true,
        },
      ],
      properties: {
        id: p.integer().primary(),
        name: p.string(),
      },
    });

    const orm2 = await MikroORM.init({
      entities: [IgnoredEntitySchema],
      dbName: `mikro_orm_test_adv_idx_mariadb`,
      port: 3309,
    });

    const sql = await orm2.schema.getCreateSchemaSQL({ wrap: false });
    expect(sql).toMatchSnapshot('ignored index');
    // MariaDB uses IGNORED instead of INVISIBLE
    expect(sql).toMatch(/ignored/i);
    expect(sql).not.toMatch(/invisible/i);

    await orm2.close();
  });
});
