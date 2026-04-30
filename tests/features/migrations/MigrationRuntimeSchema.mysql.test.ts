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

class AddViewColumnMigration extends Migration {
  override async up(): Promise<void> {
    this.addSql('alter table `article` add column `views` int unsigned not null default 0');
  }

  override async down(): Promise<void> {
    this.addSql('alter table `article` drop column `views`');
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
        migrationsList: [
          { class: CreateArticleMigration, name: 'CreateArticleMigration' },
          { class: AddViewColumnMigration, name: 'AddViewColumnMigration' },
        ],
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

  test('runs all pending migrations in the target MySQL database', async () => {
    await orm.migrator.up({ schema: tenants[0] });

    const [cols] = await orm.em
      .getConnection()
      .execute<{ c: number }[]>(
        `select count(*) c from information_schema.columns where table_schema = ? and table_name = 'article' and column_name in ('id', 'title', 'views')`,
        [tenants[0]],
      );
    expect(cols.c).toBe(3);

    const executed = await orm.migrator.getExecuted({ schema: tenants[0] });
    expect(executed.map(r => r.name)).toEqual(['CreateArticleMigration', 'AddViewColumnMigration']);
  });

  test('second up({ schema }) against the same tenant is a no-op', async () => {
    await expect(orm.migrator.up({ schema: tenants[0] })).resolves.not.toThrow();

    const pending = await orm.migrator.getPending({ schema: tenants[0] });
    expect(pending).toHaveLength(0);
  });

  test('pool connection does not leak the runtime database', async () => {
    const [{ db }] = await orm.em.getConnection().execute<{ db: string }[]>(`select database() as db`);
    expect(db).toBe('mikro_orm_rt_schema_mysql_ctl');
  });

  test('applies independently to a second database', async () => {
    await orm.migrator.up({ schema: tenants[1] });

    const [cols] = await orm.em
      .getConnection()
      .execute<{ c: number }[]>(
        `select count(*) c from information_schema.columns where table_schema = ? and table_name = 'article'`,
        [tenants[1]],
      );
    expect(cols.c).toBe(3);
  });

  test('down reverts one step in the target schema only', async () => {
    await orm.migrator.down({ schema: tenants[0] });

    const executedA = await orm.migrator.getExecuted({ schema: tenants[0] });
    expect(executedA.map(r => r.name)).toEqual(['CreateArticleMigration']);

    const executedB = await orm.migrator.getExecuted({ schema: tenants[1] });
    expect(executedB.map(r => r.name)).toEqual(['CreateArticleMigration', 'AddViewColumnMigration']);
  });
});
