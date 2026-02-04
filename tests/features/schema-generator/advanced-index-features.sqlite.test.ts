import { defineEntity, MikroORM, p } from '@mikro-orm/sqlite';

class TestEntity {

  id!: number;
  name!: string;
  email!: string;
  createdAt!: Date;

}

const TestEntity1 = defineEntity({
  class: TestEntity,
  tableName: 'adv_idx_sqlite_entity',
  indexes: [
    {
      properties: ['createdAt', 'name'],
      columns: [
        { name: 'createdAt', sort: 'DESC' },
        { name: 'name', sort: 'ASC' },
      ],
    },
    {
      name: 'collation_idx',
      properties: ['name'],
      columns: [{ name: 'name', collation: 'NOCASE' }],
    },
  ],
  properties: {
    id: p.integer().primary(),
    name: p.string(),
    email: p.string(),
    createdAt: p.datetime(),
  },
});

const TestEntity2 = defineEntity({
  class: TestEntity,
  tableName: 'adv_idx_sqlite_entity',
  indexes: [
    {
      properties: ['createdAt', 'name'],
      columns: [
        { name: 'createdAt', sort: 'ASC' },
        { name: 'name', sort: 'DESC' },
      ],
    },
    {
      name: 'collation_idx',
      properties: ['name'],
      columns: [{ name: 'name', collation: 'BINARY' }],
    },
  ],
  properties: {
    id: p.integer().primary(),
    name: p.string(),
    email: p.string(),
    createdAt: p.datetime(),
  },
});

describe('advanced index features in sqlite', () => {

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [TestEntity1],
      dbName: ':memory:',
    });
    await orm.schema.refresh();
  });

  afterAll(() => orm.close(true));

  test('schema generator creates indexes with sort order and collation', async () => {
    const sql = await orm.schema.getCreateSchemaSQL({ wrap: false });
    expect(sql).toMatchSnapshot('create schema');

    expect(sql).toMatch(/`created_at` desc/i);
    expect(sql).toMatch(/`name` asc/i);
    expect(sql).toMatch(/collate nocase/i);
  });

  test('schema generator diffs indexes with changed options', async () => {
    orm.discoverEntity(TestEntity2, TestEntity1);
    const diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('update schema');

    expect(diff).toMatch(/drop index/i);
    expect(diff).toMatch(/create.*index/i);
  });

});
