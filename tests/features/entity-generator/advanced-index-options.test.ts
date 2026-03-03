import { MikroORM } from '@mikro-orm/postgresql';
import { DatabaseSchema } from '@mikro-orm/sql';
import { ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { EntityGenerator } from '@mikro-orm/entity-generator';

describe('EntityGenerator advanced index options', () => {
  test('introspects sort order and NULLS ordering from database', async () => {
    const orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      dbName: 'mikro_orm_test_entity_gen_adv_idx',
      discovery: { warnWhenNoEntities: false },
      ensureDatabase: false,
      extensions: [EntityGenerator],
    });

    if (await orm.schema.ensureDatabase({ create: true })) {
      await orm.schema.execute(`
        DROP TABLE IF EXISTS "test_sort_nulls";
        CREATE TABLE "test_sort_nulls" (
          "id" serial PRIMARY KEY,
          "name" varchar(255) NOT NULL,
          "created_at" timestamp NOT NULL
        );
        CREATE INDEX "sort_nulls_idx" ON "test_sort_nulls" ("created_at" DESC NULLS LAST, "name" ASC);
      `);
    }

    // Verify index introspection extracts sort and nulls options
    const connection = orm.em.getDriver().getConnection();
    const platform = orm.em.getDriver().getPlatform();
    const schema = await DatabaseSchema.create(connection, platform, orm.config);
    const table = schema.getTable('test_sort_nulls');
    const indexes = table?.getIndexes() ?? [];
    const sortNullsIdx = indexes.find(i => i.keyName === 'sort_nulls_idx');

    expect(sortNullsIdx).toBeDefined();
    expect(sortNullsIdx?.columns).toBeDefined();
    expect(sortNullsIdx?.columns?.length).toBe(2);
    // First column has explicit DESC and NULLS LAST
    expect(sortNullsIdx?.columns?.[0]).toEqual({ name: 'created_at', sort: 'DESC', nulls: 'LAST' });
    // Second column has implicit ASC (PostgreSQL omits the default ASC in output)
    expect(sortNullsIdx?.columns?.[1]).toEqual({ name: 'name' });

    await orm.close(true);
  });

  test('generates entities with sort order and NULLS ordering', async () => {
    const orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      dbName: 'mikro_orm_test_entity_gen_adv_idx',
      discovery: { warnWhenNoEntities: false },
      ensureDatabase: false,
      extensions: [EntityGenerator],
    });

    if (await orm.schema.ensureDatabase({ create: true })) {
      await orm.schema.execute(`
        DROP TABLE IF EXISTS "test_sort_nulls";
        CREATE TABLE "test_sort_nulls" (
          "id" serial PRIMARY KEY,
          "name" varchar(255) NOT NULL,
          "created_at" timestamp NOT NULL
        );
        CREATE INDEX "sort_nulls_idx" ON "test_sort_nulls" ("created_at" DESC NULLS LAST, "name" ASC);
      `);
    }

    const dump = await orm.entityGenerator.generate();
    expect(dump).toMatchSnapshot('sort and nulls ordering');
    await orm.close(true);
  });

  test('generates entities with fillFactor', async () => {
    const orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      dbName: 'mikro_orm_test_entity_gen_fill_factor',
      discovery: { warnWhenNoEntities: false },
      ensureDatabase: false,
      extensions: [EntityGenerator],
    });

    if (await orm.schema.ensureDatabase({ create: true })) {
      await orm.schema.execute(`
        CREATE TABLE "test_fill_factor" (
          "id" serial PRIMARY KEY,
          "name" varchar(255) NOT NULL
        );
        CREATE INDEX "fill_factor_idx" ON "test_fill_factor" ("name") WITH (fillfactor = 70);
      `);
    }

    const dump = await orm.entityGenerator.generate();
    expect(dump).toMatchSnapshot('fillFactor');
    await orm.close(true);
  });

  test('generates entities with covering index (INCLUDE)', async () => {
    const orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      dbName: 'mikro_orm_test_entity_gen_include',
      discovery: { warnWhenNoEntities: false },
      ensureDatabase: false,
      extensions: [EntityGenerator],
    });

    if (await orm.schema.ensureDatabase({ create: true })) {
      await orm.schema.execute(`
        CREATE TABLE "test_include" (
          "id" serial PRIMARY KEY,
          "email" varchar(255) NOT NULL,
          "name" varchar(255) NOT NULL,
          "created_at" timestamp NOT NULL
        );
        CREATE INDEX "covering_idx" ON "test_include" ("email") INCLUDE ("name", "created_at");
      `);
    }

    const dump = await orm.entityGenerator.generate();
    expect(dump).toMatchSnapshot('covering index');
    await orm.close(true);
  });

  test('generates entities with index type (GIN)', async () => {
    const orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      dbName: 'mikro_orm_test_entity_gen_index_type',
      discovery: { warnWhenNoEntities: false },
      ensureDatabase: false,
      extensions: [EntityGenerator],
    });

    if (await orm.schema.ensureDatabase({ create: true })) {
      await orm.schema.execute(`
        CREATE TABLE "test_index_type" (
          "id" serial PRIMARY KEY,
          "tags" text[] NOT NULL
        );
        CREATE INDEX "gin_idx" ON "test_index_type" USING GIN ("tags");
      `);
    }

    const dump = await orm.entityGenerator.generate();
    expect(dump).toMatchSnapshot('index type');
    await orm.close(true);
  });

  test('generates entities with collation in index', async () => {
    const orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      dbName: 'mikro_orm_test_entity_gen_collation_pg',
      discovery: { warnWhenNoEntities: false },
      ensureDatabase: false,
      extensions: [EntityGenerator],
    });

    await orm.schema.ensureDatabase({ create: true });
    await orm.schema.execute('DROP TABLE IF EXISTS "test_collation"');
    await orm.schema.execute(`
      CREATE TABLE "test_collation" (
        "id" serial PRIMARY KEY,
        "name" varchar(255) NOT NULL
      )
    `);
    await orm.schema.execute('CREATE INDEX "collation_idx" ON "test_collation" ("name" COLLATE "C")');

    const dump = await orm.entityGenerator.generate();
    expect(dump).toMatchSnapshot('collation index');
    await orm.close(true);
  });

  test('generates entities with clustered index', async () => {
    const orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      dbName: 'mikro_orm_test_entity_gen_clustered_pg',
      discovery: { warnWhenNoEntities: false },
      ensureDatabase: false,
      extensions: [EntityGenerator],
    });

    await orm.schema.ensureDatabase({ create: true });
    await orm.schema.execute('DROP TABLE IF EXISTS "test_clustered"');
    await orm.schema.execute(`
      CREATE TABLE "test_clustered" (
        "id" serial PRIMARY KEY,
        "sort_key" int NOT NULL
      )
    `);
    await orm.schema.execute('CREATE INDEX "clustered_idx" ON "test_clustered" ("sort_key")');
    await orm.schema.execute('CLUSTER "test_clustered" USING "clustered_idx"');

    const dump = await orm.entityGenerator.generate();
    expect(dump).toMatchSnapshot('clustered index');
    await orm.close(true);
  });

  test('generates entities with unique constraint and advanced options', async () => {
    const orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      dbName: 'mikro_orm_test_entity_gen_unique_opts',
      discovery: { warnWhenNoEntities: false },
      ensureDatabase: false,
      extensions: [EntityGenerator],
    });

    if (await orm.schema.ensureDatabase({ create: true })) {
      await orm.schema.execute(`
        CREATE TABLE "test_unique_opts" (
          "id" serial PRIMARY KEY,
          "email" varchar(255) NOT NULL,
          "name" varchar(255) NOT NULL
        );
        CREATE UNIQUE INDEX "unique_with_include" ON "test_unique_opts" ("email") INCLUDE ("name") WITH (fillfactor = 80);
      `);
    }

    const dump = await orm.entityGenerator.generate();
    expect(dump).toMatchSnapshot('unique with advanced options');
    await orm.close(true);
  });

  test('generates entities with unique constraint with sort order', async () => {
    const orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      dbName: 'mikro_orm_test_entity_gen_unique_sort',
      discovery: { warnWhenNoEntities: false },
      ensureDatabase: false,
      extensions: [EntityGenerator],
    });

    await orm.schema.ensureDatabase({ create: true });
    await orm.schema.execute('DROP TABLE IF EXISTS "test_unique_sort"');
    await orm.schema.execute(`
      CREATE TABLE "test_unique_sort" (
        "id" serial PRIMARY KEY,
        "email" varchar(255) NOT NULL,
        "created_at" timestamp NOT NULL
      )
    `);
    await orm.schema.execute(
      'CREATE UNIQUE INDEX "unique_sort_idx" ON "test_unique_sort" ("email" DESC, "created_at" ASC)',
    );

    const dump = await orm.entityGenerator.generate();
    expect(dump).toMatchSnapshot('unique with sort order');
    await orm.close(true);
  });
});

describe('EntityGenerator advanced index options (MySQL)', () => {
  test('generates entities with invisible index', async () => {
    const { MikroORM } = await import('@mikro-orm/mysql');
    const orm = await MikroORM.init({
      dbName: 'mikro_orm_test_entity_gen_invisible',
      port: 3308,
      discovery: { warnWhenNoEntities: false },
      ensureDatabase: false,
      extensions: [EntityGenerator],
    });

    await orm.schema.ensureDatabase({ create: true });
    await orm.schema.execute('DROP TABLE IF EXISTS test_invisible');
    await orm.schema.execute(
      'CREATE TABLE test_invisible (id int PRIMARY KEY AUTO_INCREMENT, name varchar(255) NOT NULL)',
    );
    await orm.schema.execute('CREATE INDEX invisible_idx ON test_invisible (name) INVISIBLE');

    const dump = await orm.entityGenerator.generate();
    expect(dump).toMatchSnapshot('invisible index');
    await orm.close(true);
  });

  test('generates entities with prefix length in index', async () => {
    const { MikroORM } = await import('@mikro-orm/mysql');
    const orm = await MikroORM.init({
      dbName: 'mikro_orm_test_entity_gen_prefix',
      port: 3308,
      discovery: { warnWhenNoEntities: false },
      ensureDatabase: false,
      extensions: [EntityGenerator],
    });

    await orm.schema.ensureDatabase({ create: true });
    await orm.schema.execute('DROP TABLE IF EXISTS test_prefix');
    await orm.schema.execute('CREATE TABLE test_prefix (id int PRIMARY KEY AUTO_INCREMENT, content text NOT NULL)');
    await orm.schema.execute('CREATE INDEX prefix_idx ON test_prefix (content(100))');

    const dump = await orm.entityGenerator.generate();
    expect(dump).toMatchSnapshot('prefix length index');
    await orm.close(true);
  });

  test('generates entities with fulltext index', async () => {
    const { MikroORM } = await import('@mikro-orm/mysql');
    const orm = await MikroORM.init({
      dbName: 'mikro_orm_test_entity_gen_fulltext',
      port: 3308,
      discovery: { warnWhenNoEntities: false },
      ensureDatabase: false,
      extensions: [EntityGenerator],
    });

    await orm.schema.ensureDatabase({ create: true });
    await orm.schema.execute('DROP TABLE IF EXISTS test_fulltext');
    await orm.schema.execute('CREATE TABLE test_fulltext (id int PRIMARY KEY AUTO_INCREMENT, content text NOT NULL)');
    await orm.schema.execute('CREATE FULLTEXT INDEX fulltext_idx ON test_fulltext (content)');

    const dump = await orm.entityGenerator.generate();
    expect(dump).toMatchSnapshot('fulltext index');
    await orm.close(true);
  });
});

describe('EntityGenerator advanced index options (MariaDB)', () => {
  test('generates entities with fulltext index', async () => {
    const { MikroORM } = await import('@mikro-orm/mariadb');
    const orm = await MikroORM.init({
      dbName: 'mikro_orm_test_entity_gen_fulltext_maria',
      port: 3309,
      discovery: { warnWhenNoEntities: false },
      ensureDatabase: false,
      extensions: [EntityGenerator],
    });

    await orm.schema.ensureDatabase({ create: true });
    await orm.schema.execute('DROP TABLE IF EXISTS test_fulltext');
    await orm.schema.execute('CREATE TABLE test_fulltext (id int PRIMARY KEY AUTO_INCREMENT, content text NOT NULL)');
    await orm.schema.execute('CREATE FULLTEXT INDEX fulltext_idx ON test_fulltext (content)');

    const dump = await orm.entityGenerator.generate();
    expect(dump).toMatchSnapshot('fulltext index');
    await orm.close(true);
  });
});

describe('EntityGenerator advanced index options (MSSQL)', () => {
  test('generates entities with disabled index', async () => {
    const { MikroORM } = await import('@mikro-orm/mssql');
    const orm = await MikroORM.init({
      dbName: 'mikro_orm_test_entity_gen_disabled',
      password: 'Root.Root',
      discovery: { warnWhenNoEntities: false },
      ensureDatabase: false,
      extensions: [EntityGenerator],
    });

    await orm.schema.ensureDatabase({ create: true });
    await orm.schema.execute('DROP TABLE IF EXISTS test_disabled');
    await orm.schema.execute('CREATE TABLE test_disabled (id int PRIMARY KEY IDENTITY, name varchar(255) NOT NULL)');
    await orm.schema.execute('CREATE INDEX disabled_idx ON test_disabled (name)');
    await orm.schema.execute('ALTER INDEX disabled_idx ON test_disabled DISABLE');

    const dump = await orm.entityGenerator.generate();
    expect(dump).toMatchSnapshot('disabled index');
    await orm.close(true);
  });

  test('generates entities with disabled unique constraint', async () => {
    const { MikroORM } = await import('@mikro-orm/mssql');
    const orm = await MikroORM.init({
      dbName: 'mikro_orm_test_entity_gen_disabled_unique',
      password: 'Root.Root',
      discovery: { warnWhenNoEntities: false },
      ensureDatabase: false,
      extensions: [EntityGenerator],
    });

    await orm.schema.ensureDatabase({ create: true });
    await orm.schema.execute('DROP TABLE IF EXISTS test_disabled_unique');
    await orm.schema.execute(
      'CREATE TABLE test_disabled_unique (id int PRIMARY KEY IDENTITY, email varchar(255) NOT NULL)',
    );
    await orm.schema.execute('CREATE UNIQUE INDEX disabled_unique_idx ON test_disabled_unique (email)');
    await orm.schema.execute('ALTER INDEX disabled_unique_idx ON test_disabled_unique DISABLE');

    const dump = await orm.entityGenerator.generate();
    expect(dump).toMatchSnapshot('disabled unique');
    await orm.close(true);
  });

  test('generates entities with clustered index', async () => {
    const { MikroORM } = await import('@mikro-orm/mssql');
    const orm = await MikroORM.init({
      dbName: 'mikro_orm_test_entity_gen_clustered_mssql',
      password: 'Root.Root',
      discovery: { warnWhenNoEntities: false },
      ensureDatabase: false,
      extensions: [EntityGenerator],
    });

    await orm.schema.ensureDatabase({ create: true });
    await orm.schema.execute('DROP TABLE IF EXISTS test_clustered');
    // Create table with nonclustered primary key, then add a clustered index
    await orm.schema.execute('CREATE TABLE test_clustered (id int PRIMARY KEY NONCLUSTERED, sort_key int NOT NULL)');
    await orm.schema.execute('CREATE CLUSTERED INDEX clustered_idx ON test_clustered (sort_key)');

    const dump = await orm.entityGenerator.generate();
    expect(dump).toMatchSnapshot('clustered index');
    await orm.close(true);
  });
});
