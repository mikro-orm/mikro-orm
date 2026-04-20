import { defineEntity, MikroORM, OracleDriver, p } from '@mikro-orm/oracledb';
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
    this.addSql('create table "article" ("id" number(10,0) not null primary key, "title" varchar2(255) not null)');
  }

  override async down(): Promise<void> {
    this.addSql('drop table "article" cascade constraints');
  }
}

class AddViewsColumnMigration extends Migration {
  override async up(): Promise<void> {
    this.addSql('alter table "article" add ("views" number(10,0) default 0 not null)');
  }

  override async down(): Promise<void> {
    this.addSql('alter table "article" drop column "views"');
  }
}

describe('migrations with runtime schema (oracle)', () => {
  let orm: MikroORM;

  const cleanup = async () => {
    await orm.em.execute(
      `begin for rec in (select owner, table_name from all_tables where owner in ('n1', 'mikro_orm_test_multi_schemas')) loop execute immediate 'drop table "' || rec.owner || '"."' || rec.table_name || '" cascade constraints'; end loop; end;`,
    );
  };

  beforeAll(async () => {
    orm = await MikroORM.init({
      driver: OracleDriver,
      entities: [Article],
      dbName: 'mikro_orm_test_multi_schemas',
      password: 'oracle123',
      schemaGenerator: { managementDbName: 'system', tableSpace: 'mikro_orm' },
      extensions: [Migrator],
      migrations: {
        migrationsList: [
          { class: CreateArticleMigration, name: 'CreateArticleMigration' },
          { class: AddViewsColumnMigration, name: 'AddViewsColumnMigration' },
        ],
        snapshot: false,
        silent: true,
      },
    });

    await cleanup();
  });

  afterAll(async () => {
    await cleanup();
    await orm.close(true);
  });

  test('runs all pending migrations in the target Oracle schema via ALTER SESSION', async () => {
    await orm.migrator.up({ schema: 'n1' });

    const [tables] = await orm.em
      .getConnection()
      .execute<{ c: number }[]>(
        `select count(*) as c from all_tables where owner = 'n1' and table_name in ('article', 'mikro_orm_migrations')`,
      );
    expect(Number(tables.c)).toBe(2);

    const [cols] = await orm.em
      .getConnection()
      .execute<{ c: number }[]>(
        `select count(*) as c from all_tab_columns where owner = 'n1' and table_name = 'article'`,
      );
    expect(Number(cols.c)).toBe(3);

    const executed = await orm.migrator.getExecuted({ schema: 'n1' });
    expect(executed.map(r => r.name)).toEqual(['CreateArticleMigration', 'AddViewsColumnMigration']);
  });

  test('second up({ schema }) against the same tenant is a no-op', async () => {
    await expect(orm.migrator.up({ schema: 'n1' })).resolves.not.toThrow();

    const pending = await orm.migrator.getPending({ schema: 'n1' });
    expect(pending).toHaveLength(0);
  });

  test('session current_schema is reset back to the connection user', async () => {
    const [{ s }] = await orm.em
      .getConnection()
      .execute<{ s: string }[]>(`select sys_context('USERENV', 'CURRENT_SCHEMA') as s from dual`);
    expect(s?.toLowerCase()).toBe('mikro_orm_test_multi_schemas');
  });

  test('down reverts one step in the target schema', async () => {
    await orm.migrator.down({ schema: 'n1' });

    const executed = await orm.migrator.getExecuted({ schema: 'n1' });
    expect(executed.map(r => r.name)).toEqual(['CreateArticleMigration']);
  });
});
