import { defineEntity, MikroORM, p } from '@mikro-orm/mysql';
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
    this.addSql(
      'create table `article` (`id` int unsigned not null auto_increment primary key, `title` varchar(255) not null) default character set utf8mb4 engine = InnoDB',
    );
  }

  override async down(): Promise<void> {
    this.addSql('drop table `article`');
  }
}

describe('migrations with runtime schema (mysql)', () => {
  let orm: MikroORM;
  const tenants = ['mikro_orm_rt_schema_mysql_a', 'mikro_orm_rt_schema_mysql_b'];

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Article],
      dbName: 'mikro_orm_rt_schema_mysql_ctl',
      port: 3308,
      user: 'root',
      extensions: [Migrator],
      migrations: {
        migrationsList: [{ class: CreateArticleMigration, name: 'CreateArticleMigration' }],
        snapshot: false,
        silent: true,
      },
    });

    await orm.schema.ensureDatabase();

    for (const tenant of tenants) {
      await orm.em.getConnection().execute(`drop database if exists \`${tenant}\``);
      await orm.em.getConnection().execute(`create database \`${tenant}\``);
    }
  });

  afterAll(async () => {
    for (const tenant of tenants) {
      await orm.em.getConnection().execute(`drop database if exists \`${tenant}\``);
    }
    await orm.close(true);
  });

  test('migrator.up({ schema }) runs in the target MySQL database', async () => {
    await orm.migrator.up({ schema: tenants[0] });

    const [table] = await orm.em
      .getConnection()
      .execute<{ c: number }[]>(
        `select count(*) c from information_schema.tables where table_schema = ? and table_name = 'article'`,
        [tenants[0]],
      );
    expect(table.c).toBe(1);

    const [tracking] = await orm.em
      .getConnection()
      .execute<{ c: number }[]>(
        `select count(*) c from information_schema.tables where table_schema = ? and table_name = 'mikro_orm_migrations'`,
        [tenants[0]],
      );
    expect(tracking.c).toBe(1);
  });

  test('applies independently to a second database', async () => {
    await orm.migrator.up({ schema: tenants[1] });

    const [table] = await orm.em
      .getConnection()
      .execute<{ c: number }[]>(
        `select count(*) c from information_schema.tables where table_schema = ? and table_name = 'article'`,
        [tenants[1]],
      );
    expect(table.c).toBe(1);
  });
});
