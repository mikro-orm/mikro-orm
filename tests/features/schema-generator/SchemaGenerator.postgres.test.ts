import { EntitySchema, ReferenceKind, Utils, MikroORM, Type, EnumType } from '@mikro-orm/core';
import { ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { FullTextType, PostgreSqlDriver } from '@mikro-orm/postgresql';
import { BASE_DIR, initORMPostgreSql } from '../../bootstrap.js';
import {
  Address2,
  Author2,
  Book2,
  BookTag2,
  Configuration2,
  FooBar2,
  FooBaz2,
  Publisher2,
  Test2,
} from '../../entities-sql/index.js';
import { BaseEntity22 } from '../../entities-sql/BaseEntity22.js';
import { BaseEntity2 } from '../../entities-sql/BaseEntity2.js';

describe('SchemaGenerator [postgres]', () => {
  test('update schema - entity in different namespace [postgres] (GH #1215)', async () => {
    const orm = await initORMPostgreSql();
    const meta = orm.getMetadata();
    await orm.schema.update();
    await orm.schema.execute('drop schema if exists "other"');

    const newTableMeta = new EntitySchema({
      properties: {
        id: {
          primary: true,
          name: 'id',
          type: 'number',
          fieldName: 'id',
          columnType: 'int',
        },
        columnName: {
          type: 'string',
          name: 'columnName',
          fieldName: 'column_name',
          columnType: 'varchar(255)',
          unique: true,
        },
      },
      name: 'NewTable',
      tableName: 'other.new_table',
    }).init().meta;
    meta.set(newTableMeta.class, newTableMeta);
    const diff1 = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff1).toMatchSnapshot('postgres-update-schema-1215');
    await orm.schema.execute(diff1);

    meta.reset(newTableMeta.class);
    const diff2 = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff2).toMatchSnapshot('postgres-update-schema-1215');
    await orm.schema.execute(diff2);

    await orm.schema.dropDatabase();
    await orm.close();
  });

  test('update schema enums [postgres]', async () => {
    const orm = await initORMPostgreSql();
    const meta = orm.getMetadata();
    await orm.schema.update();

    const newTableMeta = new EntitySchema({
      properties: {
        id: {
          primary: true,
          name: 'id',
          type: 'number',
          fieldName: 'id',
          columnType: 'int',
        },
        enumTest: {
          type: 'string',
          name: 'enumTest',
          fieldName: 'enum_test',
          columnType: 'varchar(255)',
        },
      },
      name: 'NewTable',
      tableName: 'new_table',
    }).init().meta;
    meta.set(newTableMeta.class, newTableMeta);
    let diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('postgres-update-schema-enums-1');
    await orm.schema.execute(diff);

    // change type to enum
    newTableMeta.properties.enumTest.items = ['a', 'b'];
    newTableMeta.properties.enumTest.enum = true;
    newTableMeta.properties.enumTest.type = 'object';
    newTableMeta.properties.enumTest.columnTypes[0] = Type.getType(EnumType).getColumnType(
      newTableMeta.properties.enumTest,
      orm.em.getPlatform(),
    );
    newTableMeta.sync(false, orm.config);
    diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('postgres-update-schema-enums-2');
    await orm.schema.execute(diff);

    // change enum items
    newTableMeta.properties.enumTest.items = ['a', 'b', 'c'];
    delete newTableMeta.properties.enumTest.columnTypes[0];
    newTableMeta.properties.enumTest.columnTypes[0] = Type.getType(EnumType).getColumnType(
      newTableMeta.properties.enumTest,
      orm.em.getPlatform(),
    );
    newTableMeta.sync(false, orm.config);
    diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('postgres-update-schema-enums-3');
    await orm.schema.execute(diff);

    // check that we do not produce anything as the schema should be up to date
    diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toBe('');

    // change the type from enum to int
    delete newTableMeta.properties.enumTest.items;
    newTableMeta.properties.enumTest.columnTypes[0] = 'int';
    newTableMeta.properties.enumTest.enum = false;
    newTableMeta.properties.enumTest.type = 'number';
    newTableMeta.checks = [];
    diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('postgres-update-schema-enums-4');
    await orm.schema.execute(diff);

    await orm.close(true);
  });

  test('update schema partitioned tables [postgres] (GH #6944)', async () => {
    const orm = await initORMPostgreSql();
    const meta = orm.getMetadata();
    await orm.em.execute('drop table if exists partitioned_event cascade');
    await orm.schema.update();

    interface PartitionedEvent {
      type: string;
      id: number;
    }

    const partitionedMeta = new EntitySchema<PartitionedEvent>({
      name: 'PartitionedEvent',
      tableName: 'partitioned_event',
      partitionBy: {
        type: 'hash',
        expression: ['type'],
        partitions: 4,
      },
      properties: {
        type: {
          type: 'string',
          primary: true,
          fieldName: 'type',
          columnType: 'varchar(255)',
        },
        id: {
          type: 'number',
          primary: true,
          fieldName: 'id',
          columnType: 'int',
        },
      },
    }).init().meta;
    meta.set(partitionedMeta.class, partitionedMeta);

    let diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toContain('partition by hash ("type");');
    expect(diff).toContain(
      'create table "partitioned_event_0" partition of "partitioned_event" for values with (modulus 4, remainder 0);',
    );
    expect(diff).toContain(
      'create table "partitioned_event_3" partition of "partitioned_event" for values with (modulus 4, remainder 3);',
    );
    await orm.schema.execute(diff, { wrap: true });

    diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toBe('');

    await orm.em.execute(`insert into "partitioned_event" ("type", "id") values ('a', 1), ('b', 2)`);

    // changing the partition definition rebuilds the table (data-preserving) instead of throwing
    partitionedMeta.partitionBy = {
      type: 'hash',
      expression: ['type'],
      partitions: 8,
    };

    diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toContain('set schema "mikro_orm_partition_swap"');
    expect(diff).toContain('with (modulus 8, remainder 7)');
    expect(diff).toContain('insert into "partitioned_event"');
    expect(diff).toContain('drop schema if exists "mikro_orm_partition_swap" cascade');
    await orm.schema.execute(diff, { wrap: true });

    const rows = await orm.em.execute<{ c: number }[]>(`select count(*)::int as c from "partitioned_event"`);
    expect(rows[0].c).toBe(2);
    diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toBe('');

    await orm.close(true);
  });

  test('adding partitionBy to an existing table rebuilds it, preserving data and inbound FKs [postgres]', async () => {
    interface RebuildParent {
      id: number;
      name: string;
    }
    interface RebuildChild {
      id: number;
      parent: RebuildParent;
    }

    const Parent = new EntitySchema<RebuildParent>({
      name: 'RebuildParent',
      tableName: 'rebuild_parent',
      partitionBy: { type: 'hash', expression: ['id'], partitions: 2 },
      properties: {
        id: { type: 'number', primary: true, fieldName: 'id', columnType: 'int' },
        name: { type: 'string', fieldName: 'name', columnType: 'varchar(255)', nullable: true },
      },
    });
    const Child = new EntitySchema<RebuildChild>({
      name: 'RebuildChild',
      tableName: 'rebuild_child',
      properties: {
        id: { type: 'number', primary: true, fieldName: 'id', columnType: 'int' },
        parent: { kind: ReferenceKind.MANY_TO_ONE, entity: () => Parent, fieldName: 'parent_id' },
      },
    });

    const orm = await initORMPostgreSql(undefined, [Parent, Child]);
    await orm.em.execute('drop table if exists rebuild_child cascade');
    await orm.em.execute('drop table if exists rebuild_parent cascade');
    await orm.schema.execute('drop schema if exists "mikro_orm_partition_swap" cascade');

    // start non-partitioned to mimic a database that predates the partitionBy declaration
    const parentMeta = orm.getMetadata().get(Parent);
    const partitionBy = parentMeta.partitionBy;
    parentMeta.partitionBy = undefined;
    await orm.schema.update();

    await orm.em.execute(`insert into "rebuild_parent" ("id", "name") values (1, 'a'), (2, 'b')`);
    await orm.em.execute(`insert into "rebuild_child" ("id", "parent_id") values (10, 1), (20, 2)`);

    // declare the partitioning — the diff must rebuild the table rather than throw
    parentMeta.partitionBy = partitionBy;
    const diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatch(/alter table "rebuild_child" drop constraint/);
    expect(diff).toContain('alter table "rebuild_parent" set schema "mikro_orm_partition_swap"');
    expect(diff).toContain('partition by hash ("id")');
    expect(diff).toContain('insert into "rebuild_parent"');
    expect(diff).toMatch(/alter table "rebuild_child" add constraint .* foreign key/);
    expect(diff).toContain('drop schema if exists "mikro_orm_partition_swap" cascade');

    // safe mode keeps the parked table instead of dropping it
    const safeDiff = await orm.schema.getUpdateSchemaSQL({ wrap: false, safe: true });
    expect(safeDiff).toContain('set schema "mikro_orm_partition_swap"');
    expect(safeDiff).not.toContain('drop schema');
    expect(safeDiff).toContain('original tables kept in schema "mikro_orm_partition_swap"');

    await orm.schema.execute(diff, { wrap: true });

    // table is now partitioned, data and the inbound FK survived
    const partitioned = await orm.em.execute<{ c: number }[]>(
      `select count(*)::int as c from pg_partitioned_table p join pg_class c on c.oid = p.partrelid where c.relname = 'rebuild_parent'`,
    );
    expect(partitioned[0].c).toBe(1);
    const parents = await orm.em.execute<{ c: number }[]>(`select count(*)::int as c from "rebuild_parent"`);
    expect(parents[0].c).toBe(2);
    const children = await orm.em.execute<{ c: number }[]>(`select count(*)::int as c from "rebuild_child"`);
    expect(children[0].c).toBe(2);
    // the named inbound FK is restored against the new partitioned table (PostgreSQL also adds internal
    // per-partition FK entries, which is expected when referencing a partitioned table)
    const fks = await orm.em.execute<{ constraint_name: string }[]>(
      `select constraint_name from information_schema.table_constraints where table_name = 'rebuild_child' and constraint_type = 'FOREIGN KEY'`,
    );
    expect(fks.some(fk => fk.constraint_name === 'rebuild_child_parent_id_foreign')).toBe(true);

    // no further drift, and the temp schema was cleaned up
    expect(await orm.schema.getUpdateSchemaSQL({ wrap: false })).toBe('');

    await orm.close(true);
  });

  test('update schema range partitioned timestamptz tables [postgres] (GH #6944)', async () => {
    const orm = await initORMPostgreSql();
    const meta = orm.getMetadata();
    await orm.em.execute('drop table if exists partitioned_event_range cascade');
    await orm.schema.update();

    interface PartitionedRangeEvent {
      createdAt: Date;
      id: number;
    }

    const partitionedMeta = new EntitySchema<PartitionedRangeEvent>({
      name: 'PartitionedRangeEvent',
      tableName: 'partitioned_event_range',
      partitionBy: {
        type: 'range',
        expression: ['createdAt'],
        partitions: [
          { values: "from ('2026-01-01') to ('2026-02-01')" },
          { name: 'partitioned_event_range_default', values: 'default' },
        ],
      },
      properties: {
        createdAt: {
          type: 'Date',
          primary: true,
          fieldName: 'created_at',
          columnType: 'timestamptz',
        },
        id: {
          type: 'number',
          primary: true,
          fieldName: 'id',
          columnType: 'int',
        },
      },
    }).init().meta;
    meta.set(partitionedMeta.class, partitionedMeta);

    let diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toContain('partition by range ("created_at");');
    expect(diff).toContain(
      'create table "partitioned_event_range_0" partition of "partitioned_event_range" for values from (\'2026-01-01\') to (\'2026-02-01\');',
    );
    await orm.schema.execute(diff, { wrap: true });

    diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toBe('');

    await orm.close(true);
  });

  test('partitioned tables coexist with indexes, checks, and triggers [postgres] (GH #6944)', async () => {
    const orm = await initORMPostgreSql();
    const meta = orm.getMetadata();
    await orm.em.execute('drop table if exists partitioned_event_extras cascade');
    await orm.schema.update();

    interface PartitionedExtras {
      createdAt: Date;
      id: number;
      priority: number;
    }

    const partitionedMeta = new EntitySchema<PartitionedExtras>({
      name: 'PartitionedExtras',
      tableName: 'partitioned_event_extras',
      partitionBy: {
        type: 'range',
        expression: ['createdAt'],
        partitions: [
          { values: "from ('2026-01-01') to ('2026-02-01')" },
          { name: 'partitioned_event_extras_default', values: 'default' },
        ],
      },
      indexes: [{ name: 'partitioned_event_extras_priority_idx', properties: ['priority'] }],
      checks: [{ name: 'partitioned_event_extras_priority_chk', expression: 'priority >= 0' }],
      triggers: [
        {
          name: 'partitioned_event_extras_audit',
          timing: 'before',
          events: ['insert'],
          forEach: 'row',
          body: 'RETURN NEW',
        },
      ],
      properties: {
        createdAt: {
          type: 'Date',
          primary: true,
          fieldName: 'created_at',
          columnType: 'timestamptz',
        },
        id: {
          type: 'number',
          primary: true,
          fieldName: 'id',
          columnType: 'int',
        },
        priority: {
          type: 'number',
          fieldName: 'priority',
          columnType: 'int',
        },
      },
    }).init().meta;
    meta.set(partitionedMeta.class, partitionedMeta);

    const diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toContain('partition by range ("created_at");');
    expect(diff).toContain('"partitioned_event_extras_priority_chk" check (priority >= 0)');
    expect(diff).toContain(
      'create index "partitioned_event_extras_priority_idx" on "partitioned_event_extras" ("priority");',
    );
    expect(diff).toContain('create trigger "partitioned_event_extras_audit"');
    await orm.schema.execute(diff, { wrap: true });

    expect(await orm.schema.getUpdateSchemaSQL({ wrap: false })).toBe('');

    await orm.em.execute('drop table if exists partitioned_event_extras cascade');
    await orm.close(true);
  });

  test('postgres canonicalizes complex range partition expressions [postgres] (GH #6944)', async () => {
    const orm = await initORMPostgreSql();
    await orm.em.execute('drop table if exists partitioned_event_range_expr cascade');

    try {
      await orm.em.execute(`
        create table "partitioned_event_range_expr" (
          "created_at" timestamptz not null,
          "id" int not null
        ) partition by range (((created_at at time zone 'UTC')::date));
      `);
      await orm.em.execute(
        'create table "partitioned_event_range_expr_0" partition of "partitioned_event_range_expr" for values from (\'2026-01-01\') to (\'2026-02-01\')',
      );
      await orm.em.execute(
        'create table "partitioned_event_range_expr_default" partition of "partitioned_event_range_expr" default',
      );

      const rows = await orm.em.getConnection().execute(`
        select pg_get_partkeydef(parent.oid) as partition_definition,
               pg_get_expr(child.relpartbound, child.oid) as partition_bound,
               child.relname as partition_name
        from pg_class parent
        join pg_inherits inh on inh.inhparent = parent.oid
        join pg_class child on child.oid = inh.inhrelid
        join pg_namespace parent_ns on parent_ns.oid = parent.relnamespace
        where parent.relname = 'partitioned_event_range_expr'
          and parent_ns.nspname = 'public'
        order by child.relname
      `);

      expect(rows).toHaveLength(2);
      expect(rows[0].partition_name).toBe('partitioned_event_range_expr_0');
      expect(rows[0].partition_definition.toLowerCase()).toBe(
        "range ((((created_at at time zone 'utc'::text))::date))",
      );
      expect(rows[0].partition_bound.toLowerCase()).toBe("for values from ('2026-01-01') to ('2026-02-01')");
      expect(rows[1].partition_name).toBe('partitioned_event_range_expr_default');
      expect(rows[1].partition_bound.toLowerCase()).toBe('default');
    } finally {
      await orm.em.execute('drop table if exists partitioned_event_range_expr cascade');
      await orm.close(true);
    }
  });

  test('create/drop database [postgresql]', async () => {
    const dbName = `mikro_orm_test_${Date.now()}`;
    const orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [
        FooBar2,
        FooBaz2,
        Test2,
        Book2,
        Author2,
        Configuration2,
        Publisher2,
        BookTag2,
        Address2,
        BaseEntity2,
        BaseEntity22,
      ],
      dbName,
      baseDir: BASE_DIR,
      driver: PostgreSqlDriver,
    });

    await orm.schema.ensureDatabase();
    await orm.schema.dropDatabase(dbName);
    await orm.close(true);
  });

  test('create schema also creates the database if not exists [postgresql]', async () => {
    const dbName = `mikro_orm_test_${Date.now()}`;
    const orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [
        FooBar2,
        FooBaz2,
        Test2,
        Book2,
        Author2,
        Configuration2,
        Publisher2,
        BookTag2,
        Address2,
        BaseEntity2,
        BaseEntity22,
      ],
      dbName,
      baseDir: BASE_DIR,
      driver: PostgreSqlDriver,
      migrations: { path: BASE_DIR + '/../temp/migrations', tableName: 'public.mikro_orm_migrations' },
    });

    await orm.schema.create();
    await orm.schema.update();
    await orm.schema.drop({ wrap: false, dropMigrationsTable: false, dropDb: true });
    await orm.close(true);

    await orm.isConnected();
  });

  test('generate schema from metadata [postgres]', async () => {
    const orm = await initORMPostgreSql();
    await orm.em.execute('drop table if exists new_table cascade');

    const dropDump = await orm.schema.getDropSchemaSQL();
    expect(dropDump).toMatchSnapshot('postgres-drop-schema-dump');
    await orm.schema.execute(dropDump, { wrap: true });

    const createDump = await orm.schema.getCreateSchemaSQL();
    expect(createDump).toMatchSnapshot('postgres-create-schema-dump');
    await orm.schema.execute(createDump, { wrap: true });

    const updateDump = await orm.schema.getUpdateSchemaSQL();
    expect(updateDump).toMatchSnapshot('postgres-update-schema-dump');
    await orm.schema.execute(updateDump, { wrap: true });

    await orm.close(true);
  });

  test('update schema [postgres]', async () => {
    const orm = await initORMPostgreSql();
    await orm.em.execute('drop table if exists new_table cascade');
    const meta = orm.getMetadata();
    await orm.schema.update();

    const newTableMeta = EntitySchema.fromMetadata({
      properties: {
        id: {
          kind: ReferenceKind.SCALAR,
          primary: true,
          name: 'id',
          type: 'number',
          fieldNames: ['id'],
          columnTypes: ['int'],
          autoincrement: true,
        },
        createdAt: {
          kind: ReferenceKind.SCALAR,
          length: 3,
          defaultRaw: 'current_timestamp(3)',
          name: 'createdAt',
          type: 'Date',
          fieldNames: ['created_at'],
          columnTypes: ['timestamp(3)'],
        },
        updatedAt: {
          kind: ReferenceKind.SCALAR,
          length: 3,
          defaultRaw: 'current_timestamp(3)',
          name: 'updatedAt',
          type: 'Date',
          fieldNames: ['updated_at'],
          columnTypes: ['timestamp(3)'],
        },
        name: {
          kind: ReferenceKind.SCALAR,
          name: 'name',
          type: 'string',
          fieldNames: ['name'],
          columnTypes: ['varchar(255)'],
        },
      },
      name: 'NewTable',
      collection: 'new_table',
      primaryKey: 'id',
      hooks: {},
      indexes: [],
      uniques: [],
    } as any).init().meta;
    meta.set(newTableMeta.class, newTableMeta);
    const authorMeta = meta.get(Author2);
    authorMeta.properties.termsAccepted.defaultRaw = 'false';

    let diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('postgres-update-schema-create-table');
    await orm.schema.execute(diff, { wrap: true });

    const favouriteBookProp = Utils.copy(authorMeta.properties.favouriteBook);
    authorMeta.properties.name.type = 'number';
    authorMeta.properties.name.columnTypes = ['int'];
    authorMeta.properties.name.nullable = true;
    authorMeta.properties.name.defaultRaw = '42';
    authorMeta.properties.age.defaultRaw = '42';
    authorMeta.properties.favouriteAuthor.type = 'FooBar2';
    authorMeta.properties.favouriteAuthor.referencedTableName = 'foo_bar2';
    diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('postgres-update-schema-alter-column');
    await orm.schema.execute(diff, { wrap: true });

    delete authorMeta.properties.name.default;
    delete authorMeta.properties.name.defaultRaw;
    authorMeta.properties.name.nullable = false;
    const idProp = newTableMeta.properties.id;
    const updatedAtProp = newTableMeta.properties.updatedAt;
    newTableMeta.removeProperty('id');
    newTableMeta.removeProperty('updatedAt');
    authorMeta.removeProperty('favouriteBook');
    diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('postgres-update-schema-drop-column');
    await orm.schema.execute(diff, { wrap: true });

    const ageProp = authorMeta.properties.age;
    ageProp.name = 'ageInYears' as any;
    ageProp.fieldNames = ['age_in_years'];
    const favouriteAuthorProp = authorMeta.properties.favouriteAuthor;
    favouriteAuthorProp.name = 'favouriteWriter' as any;
    favouriteAuthorProp.fieldNames = ['favourite_writer_id'];
    favouriteAuthorProp.joinColumns = ['favourite_writer_id'];
    authorMeta.removeProperty('favouriteAuthor');
    authorMeta.addProperty(favouriteAuthorProp);
    diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('postgres-update-schema-rename-column');
    await orm.schema.execute(diff, { wrap: true });

    newTableMeta.addProperty(idProp);
    newTableMeta.addProperty(updatedAtProp);
    authorMeta.addProperty(favouriteBookProp);
    diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('postgres-update-schema-add-column');
    await orm.schema.execute(diff, { wrap: true });
    diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toBe('');

    // remove 1:1 relation
    const fooBarMeta = meta.get(FooBar2);
    const fooBazMeta = meta.get(FooBaz2);
    fooBarMeta.removeProperty('baz');
    fooBazMeta.removeProperty('bar');
    diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('postgres-update-schema-drop-1:1');
    await orm.schema.execute(diff, { wrap: true });

    meta.reset(Author2);
    meta.reset(newTableMeta.class);
    diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('postgres-update-schema-drop-table');
    await orm.schema.execute(diff, { wrap: true });

    await orm.close(true);
  });

  test('update indexes [postgres]', async () => {
    const orm = await initORMPostgreSql();
    const meta = orm.getMetadata();
    await orm.schema.update();

    meta.get(Book2).indexes.push({
      properties: ['author', 'publisher'],
    });

    meta.get(Author2).indexes.push({
      properties: ['name', 'email'],
      type: 'fulltext',
    });

    meta.get(Book2).uniques.push({
      properties: ['author', 'publisher'],
    });

    let diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('postgres-update-schema-add-index');
    await orm.schema.execute(diff, { wrap: true });

    meta.get(Book2).indexes[1].name = 'custom_idx_123';

    diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('postgres-update-schema-alter-index');
    await orm.schema.execute(diff, { wrap: true });

    meta.get(Book2).indexes = [];

    diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('postgres-update-schema-drop-index');
    await orm.schema.execute(diff, { wrap: true });

    meta.get(Book2).uniques = [];

    diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('postgres-update-schema-drop-unique');
    await orm.schema.execute(diff, { wrap: true });

    // test changing a column to tsvector and adding an index
    meta.get(Book2).properties.title.defaultRaw = undefined;
    meta.get(Book2).properties.title.customType = Type.getType(FullTextType);
    meta.get(Book2).properties.title.columnTypes[0] = Type.getType(FullTextType).getColumnType();
    meta.get(Book2).indexes.push({ type: 'fulltext', properties: ['title'] });

    diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('postgres-update-schema-add-fulltext-index-tsvector');
    await orm.schema.execute(diff, { wrap: true });

    await orm.close(true);
  });

  test('update empty schema from metadata [postgres]', async () => {
    const orm = await initORMPostgreSql();
    await orm.schema.drop();

    const updateDump = await orm.schema.getUpdateSchemaSQL();
    expect(updateDump).toMatchSnapshot('postgres-update-empty-schema-dump');
    await orm.schema.execute(updateDump, { wrap: true });

    await orm.close(true);
  });
});
