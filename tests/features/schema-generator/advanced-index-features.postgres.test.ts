import { DeferMode, defineEntity, MikroORM, p, type Options } from '@mikro-orm/postgresql';

class TestEntity {
  id!: number;
  name!: string;
  email!: string;
  createdAt!: Date;
}

const TestEntity1 = defineEntity({
  class: TestEntity,
  tableName: 'adv_idx_pg_entity',
  indexes: [
    {
      properties: ['createdAt', 'name'],
      columns: [
        { name: 'createdAt', sort: 'DESC', nulls: 'LAST' },
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
      name: 'collation_idx',
      properties: ['name'],
      columns: [{ name: 'name', collation: 'C' }],
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

const TestEntity2 = defineEntity({
  class: TestEntity,
  tableName: 'adv_idx_pg_entity',
  indexes: [
    {
      properties: ['createdAt', 'name'],
      columns: [
        { name: 'createdAt', sort: 'ASC', nulls: 'FIRST' },
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

class DeferredEntity {
  id!: number;
  email!: string;
}

const DeferredEntitySchema = defineEntity({
  class: DeferredEntity,
  tableName: 'deferred_entity',
  uniques: [
    {
      properties: ['email'],
      deferMode: DeferMode.INITIALLY_DEFERRED,
    },
  ],
  properties: {
    id: p.integer().primary(),
    email: p.string(),
  },
});

class ColumnNameTestEntity {
  id!: number;
  name!: string;
  email!: string;
}

const ColumnNameTest1 = defineEntity({
  class: ColumnNameTestEntity,
  tableName: 'column_name_test',
  indexes: [
    {
      name: 'col_name_idx',
      properties: ['name', 'email'],
      columns: [
        { name: 'name', sort: 'ASC' },
        { name: 'email', sort: 'DESC' },
      ],
    },
  ],
  properties: {
    id: p.integer().primary(),
    name: p.string(),
    email: p.string(),
  },
});

const ColumnNameTest2 = defineEntity({
  class: ColumnNameTestEntity,
  tableName: 'column_name_test',
  indexes: [
    {
      name: 'col_name_idx',
      properties: ['email', 'name'],
      columns: [
        { name: 'email', sort: 'ASC' },
        { name: 'name', sort: 'DESC' },
      ],
    },
  ],
  properties: {
    id: p.integer().primary(),
    name: p.string(),
    email: p.string(),
  },
});

class CollationTestEntity {
  id!: number;
  name!: string;
}

const CollationTest1 = defineEntity({
  class: CollationTestEntity,
  tableName: 'collation_diff_test',
  indexes: [
    {
      name: 'collation_test_idx',
      properties: ['name'],
      columns: [{ name: 'name', collation: 'C' }],
    },
  ],
  properties: {
    id: p.integer().primary(),
    name: p.string(),
  },
});

const CollationTest2 = defineEntity({
  class: CollationTestEntity,
  tableName: 'collation_diff_test',
  indexes: [
    {
      name: 'collation_test_idx',
      properties: ['name'],
      columns: [{ name: 'name', collation: 'POSIX' }],
    },
  ],
  properties: {
    id: p.integer().primary(),
    name: p.string(),
  },
});

class LengthTestEntity {
  id!: number;
  name!: string;
}

const LengthTest1 = defineEntity({
  class: LengthTestEntity,
  tableName: 'length_diff_test',
  indexes: [
    {
      name: 'length_test_idx',
      properties: ['name'],
      columns: [{ name: 'name', length: 100 }],
    },
  ],
  properties: {
    id: p.integer().primary(),
    name: p.string(),
  },
});

const LengthTest2 = defineEntity({
  class: LengthTestEntity,
  tableName: 'length_diff_test',
  indexes: [
    {
      name: 'length_test_idx',
      properties: ['name'],
      columns: [{ name: 'name', length: 50 }],
    },
  ],
  properties: {
    id: p.integer().primary(),
    name: p.string(),
  },
});

class IncludeTestEntity {
  id!: number;
  name!: string;
  email!: string;
  createdAt!: Date;
}

const IncludeTest1 = defineEntity({
  class: IncludeTestEntity,
  tableName: 'include_diff_test',
  indexes: [
    {
      name: 'include_test_idx',
      properties: ['email'],
      include: ['name', 'createdAt'],
    },
  ],
  properties: {
    id: p.integer().primary(),
    name: p.string(),
    email: p.string(),
    createdAt: p.datetime(),
  },
});

const IncludeTest2 = defineEntity({
  class: IncludeTestEntity,
  tableName: 'include_diff_test',
  indexes: [
    {
      name: 'include_test_idx',
      properties: ['email'],
      include: ['name'],
    },
  ],
  properties: {
    id: p.integer().primary(),
    name: p.string(),
    email: p.string(),
    createdAt: p.datetime(),
  },
});

class NullsTestEntity {
  id!: number;
  createdAt!: Date;
}

const NullsTest1 = defineEntity({
  class: NullsTestEntity,
  tableName: 'nulls_diff_test',
  indexes: [
    {
      name: 'nulls_test_idx',
      properties: ['createdAt'],
      columns: [{ name: 'createdAt', sort: 'DESC', nulls: 'LAST' }],
    },
  ],
  properties: {
    id: p.integer().primary(),
    createdAt: p.datetime(),
  },
});

const NullsTest2 = defineEntity({
  class: NullsTestEntity,
  tableName: 'nulls_diff_test',
  indexes: [
    {
      name: 'nulls_test_idx',
      properties: ['createdAt'],
      columns: [{ name: 'createdAt', sort: 'DESC', nulls: 'FIRST' }],
    },
  ],
  properties: {
    id: p.integer().primary(),
    createdAt: p.datetime(),
  },
});

class InvalidFillFactorEntity {
  id!: number;
  name!: string;
}

const InvalidFillFactorSchema = defineEntity({
  class: InvalidFillFactorEntity,
  tableName: 'invalid_fill_factor',
  indexes: [
    {
      name: 'invalid_idx',
      properties: ['name'],
      fillFactor: 150,
    },
  ],
  properties: {
    id: p.integer().primary(),
    name: p.string(),
  },
});

class NullsDefaultEntity {
  id!: number;
  createdAt!: Date;
}

// DESC + NULLS FIRST is the default for DESC, so it should not generate a diff
const NullsDefaultSchema = defineEntity({
  class: NullsDefaultEntity,
  tableName: 'nulls_default_test',
  indexes: [
    {
      name: 'nulls_default_idx',
      properties: ['createdAt'],
      columns: [{ name: 'createdAt', sort: 'DESC', nulls: 'FIRST' }],
    },
  ],
  properties: {
    id: p.integer().primary(),
    createdAt: p.datetime(),
  },
});

class ColumnsOnlyEntity {
  id!: number;
  name!: string;
  email!: string;
}

// Test: columns specified without properties should auto-derive properties
const ColumnsOnlySchema = defineEntity({
  class: ColumnsOnlyEntity,
  tableName: 'columns_only_test',
  indexes: [
    {
      name: 'columns_only_idx',
      columns: [{ name: 'name', sort: 'DESC' }, { name: 'email' }],
    },
  ],
  properties: {
    id: p.integer().primary(),
    name: p.string(),
    email: p.string(),
  },
});

class ColumnsMismatchEntity {
  id!: number;
  name!: string;
}

// Test: columns referencing a field not in properties should throw
const ColumnsMismatchSchema = defineEntity({
  class: ColumnsMismatchEntity,
  tableName: 'columns_mismatch_test',
  indexes: [
    {
      name: 'mismatch_idx',
      properties: ['name'],
      columns: [{ name: 'name' }, { name: 'nonExistent' }],
    },
  ],
  properties: {
    id: p.integer().primary(),
    name: p.string(),
  },
});

describe('advanced index features in postgres', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [TestEntity1],
      dbName: `mikro_orm_test_adv_idx_pg`,
    });
    await orm.em.getConnection().execute('drop table if exists "entity_gen_test" cascade');
    await orm.em.getConnection().execute('drop table if exists "test_entity" cascade');
    await orm.em.getConnection().execute('drop table if exists "columns_only_test" cascade');
    await orm.em.getConnection().execute('drop table if exists "nulls_default_test" cascade');
    await orm.schema.refresh();
  });

  afterAll(() => orm.close(true));

  test('schema generator creates indexes with sort order, nulls ordering, include, fill factor, and unique with include', async () => {
    const sql = await orm.schema.getCreateSchemaSQL({ wrap: false });
    expect(sql).toMatchSnapshot('create schema');

    expect(sql).toMatch(/desc nulls last/i);
    expect(sql).toMatch(/include.*"name".*"created_at"/i);
    expect(sql).toMatch(/fillfactor\s*=\s*70/i);
    expect(sql).toMatch(/collate "C"/i);
    expect(sql).toMatch(/unique.*"email".*include/i);
    expect(sql).toMatch(/fillfactor\s*=\s*80/i);
  });

  test('schema generator detects no changes when indexes with columns options match', async () => {
    // This test verifies that when an index with columns options matches the database,
    // no diff is generated (hits SchemaComparator.compareIndexColumns return true)
    const diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    // After initial sync (in beforeAll), re-running diff with same entity should produce empty diff
    expect(diff).toBe('');
  });

  test('schema generator diffs indexes with changed options', async () => {
    orm.discoverEntity(TestEntity2, TestEntity1);
    const diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('update schema');

    expect(diff).toMatch(/drop index/i);
    expect(diff).toMatch(/create.*index/i);
  });

  test('schema generator creates deferred unique constraints', async () => {
    const orm2 = await MikroORM.init({
      entities: [DeferredEntitySchema],
      dbName: `mikro_orm_test_adv_idx_pg`,
    });

    const sql = await orm2.schema.getCreateSchemaSQL({ wrap: false });
    expect(sql).toMatchSnapshot('deferred unique');
    expect(sql).toMatch(/deferrable initially deferred/i);

    await orm2.close();
  });

  test('throws on invalid fillFactor', async () => {
    const orm2 = await MikroORM.init({
      entities: [InvalidFillFactorSchema],
      dbName: `mikro_orm_test_adv_idx_pg`,
      connect: false,
    } as Options);

    await expect(orm2.schema.getCreateSchemaSQL()).rejects.toThrow('fillFactor must be between 0 and 100');

    await orm2.close();
  });

  test('schema comparator detects column name changes in index', async () => {
    const orm2 = await MikroORM.init({
      entities: [ColumnNameTest1],
      dbName: `mikro_orm_test_adv_idx_pg`,
    });

    await orm2.schema.refresh();

    orm2.discoverEntity(ColumnNameTest2, ColumnNameTest1);
    const diff = await orm2.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatch(/drop index/i);
    expect(diff).toMatch(/create.*index/i);

    await orm2.schema.drop();
    await orm2.close();
  });

  test('schema comparator detects collation changes in index', async () => {
    const orm2 = await MikroORM.init({
      entities: [CollationTest1],
      dbName: `mikro_orm_test_adv_idx_pg`,
    });

    await orm2.schema.refresh();

    orm2.discoverEntity(CollationTest2, CollationTest1);
    const diff = await orm2.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatch(/drop index/i);
    expect(diff).toMatch(/create.*index/i);

    await orm2.schema.drop();
    await orm2.close();
  });

  test('schema comparator detects length changes', async () => {
    const orm2 = await MikroORM.init({
      entities: [LengthTest1],
      dbName: `mikro_orm_test_adv_idx_pg`,
    });

    await orm2.schema.refresh();

    orm2.discoverEntity(LengthTest2, LengthTest1);
    const diff = await orm2.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatch(/drop index/i);
    expect(diff).toMatch(/create.*index/i);

    await orm2.schema.drop();
    await orm2.close();
  });

  test('schema comparator detects include array changes', async () => {
    const orm2 = await MikroORM.init({
      entities: [IncludeTest1],
      dbName: `mikro_orm_test_adv_idx_pg`,
    });

    await orm2.schema.refresh();

    orm2.discoverEntity(IncludeTest2, IncludeTest1);
    const diff = await orm2.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatch(/drop index/i);
    expect(diff).toMatch(/create.*index/i);

    await orm2.schema.drop();
    await orm2.close();
  });

  test('schema comparator detects nulls ordering changes', async () => {
    const orm2 = await MikroORM.init({
      entities: [NullsTest1],
      dbName: `mikro_orm_test_adv_idx_pg`,
    });

    await orm2.schema.refresh();

    orm2.discoverEntity(NullsTest2, NullsTest1);
    const diff = await orm2.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatch(/drop index/i);
    expect(diff).toMatch(/create.*index/i);

    await orm2.schema.drop();
    await orm2.close();
  });

  test('explicit default nulls ordering does not cause diff (DESC + NULLS FIRST)', async () => {
    const orm2 = await MikroORM.init({
      entities: [NullsDefaultSchema],
      dbName: `mikro_orm_test_adv_idx_nulls_default`,
    });

    await orm2.schema.refresh();

    // After syncing, the database has DESC + NULLS FIRST (which PG treats as default for DESC).
    // Re-running diff with the same entity that explicitly specifies these defaults should produce no changes.
    const diff = await orm2.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toBe('');

    await orm2.schema.drop();
    await orm2.close(true);
  });

  test('columns without properties auto-derives properties', async () => {
    const orm2 = await MikroORM.init({
      entities: [ColumnsOnlySchema],
      dbName: `mikro_orm_test_adv_idx_cols_only`,
    });

    const sql = await orm2.schema.getCreateSchemaSQL({ wrap: false });
    expect(sql).toMatch(/create index "columns_only_idx"/i);
    expect(sql).toMatch(/desc/i);

    await orm2.schema.refresh();
    const diff = await orm2.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toBe('');

    await orm2.schema.drop();
    await orm2.close(true);
  });

  test('throws on columns/properties mismatch', async () => {
    const orm2 = await MikroORM.init({
      entities: [ColumnsMismatchSchema],
      dbName: `mikro_orm_test_adv_idx_pg`,
      connect: false,
    } as Options);

    await expect(orm2.schema.getCreateSchemaSQL()).rejects.toThrow(
      /column option references field.*which is not in the index properties/,
    );

    await orm2.close();
  });

  test('throws on invalid fillFactor in getCreateIndexSQL', async () => {
    const helper = orm.em.getPlatform().getSchemaHelper()!;
    expect(() =>
      helper.getCreateIndexSQL('test_table', {
        keyName: 'test_idx',
        columnNames: ['name'],
        unique: false,
        primary: false,
        constraint: false,
        fillFactor: 200,
      }),
    ).toThrow('fillFactor must be between 0 and 100, got 200');
  });
});
