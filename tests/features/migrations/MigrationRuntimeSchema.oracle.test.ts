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

describe('migrations with runtime schema (oracle)', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      driver: OracleDriver,
      entities: [Article],
      dbName: 'mikro_orm_test_multi_schemas',
      password: 'oracle123',
      schemaGenerator: { managementDbName: 'system', tableSpace: 'mikro_orm' },
      extensions: [Migrator],
      migrations: {
        migrationsList: [{ class: CreateArticleMigration, name: 'CreateArticleMigration' }],
        snapshot: false,
        silent: true,
      },
    });

    await orm.em.execute(
      `begin for rec in (select owner, table_name from all_tables where owner in ('n1', 'mikro_orm_test_multi_schemas')) loop execute immediate 'drop table "' || rec.owner || '"."' || rec.table_name || '" cascade constraints'; end loop; end;`,
    );
  });

  afterAll(async () => {
    await orm.em.execute(
      `begin for rec in (select owner, table_name from all_tables where owner in ('n1', 'mikro_orm_test_multi_schemas')) loop execute immediate 'drop table "' || rec.owner || '"."' || rec.table_name || '" cascade constraints'; end loop; end;`,
    );
    await orm.close(true);
  });

  test('migrator.up({ schema }) switches session schema via ALTER SESSION', async () => {
    await orm.migrator.up({ schema: 'n1' });

    const [table] = await orm.em
      .getConnection()
      .execute<{ c: number }[]>(`select count(*) as c from all_tables where owner = 'n1' and table_name = 'article'`);
    expect(Number(table.c)).toBe(1);

    const [tracking] = await orm.em
      .getConnection()
      .execute<{ c: number }[]>(
        `select count(*) as c from all_tables where owner = 'n1' and table_name = 'mikro_orm_migrations'`,
      );
    expect(Number(tracking.c)).toBe(1);
  });
});
