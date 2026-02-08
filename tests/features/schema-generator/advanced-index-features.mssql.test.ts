import { defineEntity, MikroORM, MsSqlSchemaHelper, p, type IndexDef } from '@mikro-orm/mssql';

class TestEntity {

  id!: number;
  name!: string;
  email!: string;
  createdAt!: Date;

}

const TestEntity1 = defineEntity({
  class: TestEntity,
  tableName: 'adv_idx_mssql_entity',
  indexes: [
    {
      properties: ['createdAt', 'name'],
      columns: [
        { name: 'createdAt', sort: 'DESC' },
        { name: 'name', sort: 'ASC' },
      ],
    },
    {
      name: 'covering_idx',
      properties: ['email'],
      include: ['name', 'createdAt'],
    },
    {
      name: 'fill_factor_idx',
      properties: ['name'],
      fillFactor: 70,
    },
    {
      name: 'disabled_idx',
      properties: ['email'],
      disabled: true,
    },
  ],
  uniques: [
    {
      name: 'unique_with_include',
      properties: ['email'],
      include: ['name'],
      fillFactor: 60,
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
  tableName: 'adv_idx_mssql_entity',
  indexes: [
    {
      properties: ['createdAt', 'name'],
      columns: [
        { name: 'createdAt', sort: 'ASC' },
        { name: 'name', sort: 'DESC' },
      ],
    },
    {
      name: 'covering_idx',
      properties: ['email'],
      include: ['name'],
    },
    {
      name: 'fill_factor_idx',
      properties: ['name'],
      fillFactor: 90,
    },
    {
      name: 'disabled_idx',
      properties: ['email'],
      disabled: false,
    },
  ],
  uniques: [
    {
      name: 'unique_with_include',
      properties: ['email'],
      include: ['name'],
      fillFactor: 80,
    },
  ],
  properties: {
    id: p.integer().primary(),
    name: p.string(),
    email: p.string(),
    createdAt: p.datetime(),
  },
});

describe('advanced index features in mssql', () => {

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [TestEntity1],
      dbName: `mikro_orm_test_adv_idx_mssql`,
      password: 'Root.Root',
    });
    await orm.schema.refresh();
  });

  afterAll(() => orm.close(true));

  test('schema generator creates indexes with sort order, include, fill factor, and disabled', async () => {
    const sql = await orm.schema.getCreateSchemaSQL({ wrap: false });
    expect(sql).toMatchSnapshot('create schema');

    expect(sql).toMatch(/\[created_at\] desc/i);
    expect(sql).toMatch(/include.*\[name\].*\[created_at\]/i);
    expect(sql).toMatch(/fillfactor\s*=\s*70/i);
    expect(sql).toMatch(/alter index.*disable/i);
    expect(sql).toMatch(/unique.*index.*\[email\].*include.*\[name\]/i);
    expect(sql).toMatch(/fillfactor\s*=\s*60/i);
  });

  test('schema generator diffs indexes with changed options', async () => {
    orm.discoverEntity(TestEntity2, TestEntity1);
    const diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('update schema');

    expect(diff).toMatch(/drop index/i);
    expect(diff).toMatch(/create.*index/i);
  });

  test('getCreateIndexSQL generates clustered index syntax', async () => {
    const schemaHelper = orm.em.getDriver().getPlatform().getSchemaHelper()! as MsSqlSchemaHelper;
    const index: IndexDef = {
      keyName: 'clustered_test_idx',
      columnNames: ['name'],
      unique: false,
      primary: false,
      constraint: false,
      clustered: true,
    };

    const sql = schemaHelper.getCreateIndexSQL('test_table', index);
    expect(sql).toMatch(/create\s+clustered\s+index/i);
  });

  test('getCreateIndexSQL with columns and include', async () => {
    const schemaHelper = orm.em.getDriver().getPlatform().getSchemaHelper()! as MsSqlSchemaHelper;
    const index: IndexDef = {
      keyName: 'covering_test_idx',
      columnNames: ['email'],
      columns: [{ name: 'email', sort: 'DESC' }],
      include: ['name', 'created_at'],
      unique: false,
      primary: false,
      constraint: false,
    };

    const sql = schemaHelper.getCreateIndexSQL('test_table', index);
    expect(sql).toMatch(/\[email\] desc/i);
    expect(sql).toMatch(/include.*\[name\].*\[created_at\]/i);
  });

  test('getCreateIndexSQL with disabled flag', async () => {
    const schemaHelper = orm.em.getDriver().getPlatform().getSchemaHelper()! as MsSqlSchemaHelper;
    const index: IndexDef = {
      keyName: 'disabled_test_idx',
      columnNames: ['name'],
      unique: false,
      primary: false,
      constraint: false,
      disabled: true,
    };

    const sql = schemaHelper.getCreateIndexSQL('test_table', index);
    expect(sql).toMatch(/alter index.*disable/i);
  });

  test('schema comparator detects disabled flag change only', async () => {
    class DisabledTestEntity {

      id!: number;
      name!: string;

    }

    const DisabledTest1 = defineEntity({
      class: DisabledTestEntity,
      tableName: 'disabled_change_test',
      indexes: [{ name: 'dis_idx', properties: ['name'], disabled: false }],
      properties: {
        id: p.integer().primary(),
        name: p.string(),
      },
    });

    const DisabledTest2 = defineEntity({
      class: DisabledTestEntity,
      tableName: 'disabled_change_test',
      indexes: [{ name: 'dis_idx', properties: ['name'], disabled: true }],
      properties: {
        id: p.integer().primary(),
        name: p.string(),
      },
    });

    const orm2 = await MikroORM.init({
      entities: [DisabledTest1],
      dbName: `mikro_orm_test_adv_idx_mssql`,
      password: 'Root.Root',
    });

    await orm2.schema.execute('drop table if exists [disabled_change_test]');
    await orm2.schema.refresh();

    orm2.discoverEntity(DisabledTest2, DisabledTest1);
    const diff = await orm2.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatch(/drop index.*dis_idx/i);
    expect(diff).toMatch(/alter index.*dis_idx.*disable/i);

    await orm2.schema.drop();
    await orm2.close();
  });

  test('throws on invalid fillFactor in getCreateIndexSQL', () => {
    const schemaHelper = orm.em.getDriver().getPlatform().getSchemaHelper()! as MsSqlSchemaHelper;
    expect(() => schemaHelper.getCreateIndexSQL('test_table', {
      keyName: 'bad_ff_idx',
      columnNames: ['name'],
      unique: false,
      primary: false,
      constraint: false,
      fillFactor: -1,
    })).toThrow('fillFactor must be between 0 and 100, got -1');
  });

  test('createIndex with disabled unique on nullable column', async () => {
    class DisabledUniqueEntity {

      id!: number;
      email?: string;

    }

    const DisabledUniqueSchema = defineEntity({
      class: DisabledUniqueEntity,
      tableName: 'disabled_unique_nullable',
      uniques: [{ name: 'dis_uniq_idx', properties: ['email'], disabled: true }],
      properties: {
        id: p.integer().primary(),
        email: p.string().nullable(),
      },
    });

    const orm2 = await MikroORM.init({
      entities: [DisabledUniqueSchema],
      dbName: `mikro_orm_test_adv_idx_mssql`,
      password: 'Root.Root',
    });

    await orm2.schema.execute('drop table if exists [disabled_unique_nullable]');
    const sql = await orm2.schema.getCreateSchemaSQL({ wrap: false });
    // Should have WHERE ... is not null (nullable unique) AND alter index ... disable
    expect(sql).toMatch(/where.*\[email\] is not null/i);
    expect(sql).toMatch(/alter index.*\[dis_uniq_idx\].*disable/i);

    await orm2.close();
  });

  test('schema comparator detects clustered flag change only', async () => {
    class ClusteredTestEntity {

      id!: number;
      name!: string;

    }

    const ClusteredTest1 = defineEntity({
      class: ClusteredTestEntity,
      tableName: 'clustered_change_test',
      indexes: [{ name: 'clust_idx', properties: ['name'], clustered: false }],
      properties: {
        id: p.integer().primary(),
        name: p.string(),
      },
    });

    const ClusteredTest2 = defineEntity({
      class: ClusteredTestEntity,
      tableName: 'clustered_change_test',
      indexes: [{ name: 'clust_idx', properties: ['name'], clustered: true }],
      properties: {
        id: p.integer().primary(),
        name: p.string(),
      },
    });

    const orm2 = await MikroORM.init({
      entities: [ClusteredTest1],
      dbName: `mikro_orm_test_adv_idx_mssql`,
      password: 'Root.Root',
    });

    await orm2.schema.execute('drop table if exists [clustered_change_test]');
    await orm2.schema.refresh();

    orm2.discoverEntity(ClusteredTest2, ClusteredTest1);
    const diff = await orm2.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatch(/drop index.*clust_idx/i);
    expect(diff).toMatch(/create\s+clustered\s+index/i);

    await orm2.schema.drop();
    await orm2.close();
  });

});
