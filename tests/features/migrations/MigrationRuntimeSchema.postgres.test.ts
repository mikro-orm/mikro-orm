process.env.FORCE_COLOR = '0';
import { defineEntity, DatabaseSchema, MikroORM, p } from '@mikro-orm/postgresql';
import { Migration, Migrator } from '@mikro-orm/migrations';

const Article = defineEntity({
  name: 'Article',
  tableName: 'article',
  schema: '*',
  properties: {
    id: p.integer().primary(),
    title: p.string(),
  },
});

class CreateArticleMigration extends Migration {
  override async up(): Promise<void> {
    this.addSql('create table "article" ("id" serial primary key, "title" varchar not null)');
  }

  override async down(): Promise<void> {
    this.addSql('drop table "article"');
  }
}

describe('migrations with runtime schema (postgres)', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Article],
      dbName: `mikro_orm_test_migration_runtime_schema`,
      extensions: [Migrator],
      migrations: {
        migrationsList: [{ class: CreateArticleMigration, name: 'CreateArticleMigration' }],
        snapshot: false,
        silent: true,
      },
    });

    await orm.schema.ensureDatabase();
    for (const schemaName of ['tenant_a', 'tenant_b']) {
      await orm.em.getConnection().execute(`drop schema if exists "${schemaName}" cascade`);
    }
  });

  afterAll(async () => {
    for (const schemaName of ['tenant_a', 'tenant_b']) {
      await orm.em.getConnection().execute(`drop schema if exists "${schemaName}" cascade`);
    }
    await orm.close(true);
  });

  test('migrator.up({ schema }) does not leak search_path onto the pooled connection', async () => {
    await orm.em.getConnection().execute('create schema "tenant_a"');
    await orm.migrator.up({ schema: 'tenant_a' });

    const [{ search_path }] = await orm.em.getConnection().execute<{ search_path: string }[]>(`show search_path`);
    expect(search_path).not.toContain('tenant_a');
  });

  test('migrator.up({ schema }) creates table + tracking table in the target schema', async () => {
    const [tableInTenant] = await orm.em
      .getConnection()
      .execute<{ exists: boolean }[]>(
        `select exists (select 1 from information_schema.tables where table_schema = 'tenant_a' and table_name = 'article') as exists`,
      );
    expect(tableInTenant.exists).toBe(true);

    const [trackingInTenant] = await orm.em
      .getConnection()
      .execute<{ exists: boolean }[]>(
        `select exists (select 1 from information_schema.tables where table_schema = 'tenant_a' and table_name = 'mikro_orm_migrations') as exists`,
      );
    expect(trackingInTenant.exists).toBe(true);

    const [tableInPublic] = await orm.em
      .getConnection()
      .execute<{ exists: boolean }[]>(
        `select exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'article') as exists`,
      );
    expect(tableInPublic.exists).toBe(false);
  });

  test('same unqualified migration applies to a second schema independently', async () => {
    await orm.em.getConnection().execute('create schema "tenant_b"');
    await orm.migrator.up({ schema: 'tenant_b' });

    const [tableInB] = await orm.em
      .getConnection()
      .execute<{ exists: boolean }[]>(
        `select exists (select 1 from information_schema.tables where table_schema = 'tenant_b' and table_name = 'article') as exists`,
      );
    expect(tableInB.exists).toBe(true);

    const rowsA = await orm.em
      .getConnection()
      .execute<{ name: string }[]>(`select name from "tenant_a"."mikro_orm_migrations"`);
    const rowsB = await orm.em
      .getConnection()
      .execute<{ name: string }[]>(`select name from "tenant_b"."mikro_orm_migrations"`);
    expect(rowsA).toHaveLength(1);
    expect(rowsB).toHaveLength(1);
  });

  test('migrator.down({ schema }) reverts only the target schema', async () => {
    await orm.migrator.down({ schema: 'tenant_a' });

    const [gone] = await orm.em
      .getConnection()
      .execute<{ exists: boolean }[]>(
        `select exists (select 1 from information_schema.tables where table_schema = 'tenant_a' and table_name = 'article') as exists`,
      );
    expect(gone.exists).toBe(false);

    const [stillInB] = await orm.em
      .getConnection()
      .execute<{ exists: boolean }[]>(
        `select exists (select 1 from information_schema.tables where table_schema = 'tenant_b' and table_name = 'article') as exists`,
      );
    expect(stillInB.exists).toBe(true);
  });

  test('includeWildcardSchema opts wildcard entities back into the diff with unqualified SQL', async () => {
    const emptySchema = new DatabaseSchema(
      orm.em.getPlatform(),
      orm.config.get('schema', orm.em.getPlatform().getDefaultSchemaName()),
    );

    const prunedDiff = await orm.schema.getUpdateSchemaMigrationSQL({ fromSchema: emptySchema });
    expect(prunedDiff.up.trim()).toBe('');

    const fullDiff = await orm.schema.getUpdateSchemaMigrationSQL({
      includeWildcardSchema: true,
      fromSchema: emptySchema,
    });
    expect(fullDiff.up).toContain('create table "article"');
    expect(fullDiff.up).not.toMatch(/create table "[^"]+"\."article"/);
  });

  test('migrations.schema config acts as default when no override is passed', async () => {
    await orm.em.getConnection().execute('drop schema if exists "tenant_b" cascade');
    await orm.em.getConnection().execute('create schema "tenant_b"');

    const original = orm.config.get('migrations');
    orm.config.set('migrations', { ...original, schema: 'tenant_b' });
    orm.config.resetServiceCache();

    try {
      await orm.migrator.up();

      const [res] = await orm.em
        .getConnection()
        .execute<{ exists: boolean }[]>(
          `select exists (select 1 from information_schema.tables where table_schema = 'tenant_b' and table_name = 'article') as exists`,
        );
      expect(res.exists).toBe(true);
    } finally {
      orm.config.set('migrations', original);
      orm.config.resetServiceCache();
    }
  });
});
