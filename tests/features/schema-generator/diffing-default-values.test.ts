import { MikroORM, Opt, sql } from '@mikro-orm/core';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { MySqlDriver } from '@mikro-orm/mysql';
import { MariaDbDriver } from '@mikro-orm/mariadb';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { SqliteDriver } from '@mikro-orm/sqlite';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';

class Foo {

  @PrimaryKey()
  id!: number;

  @Property({ defaultRaw: "'test'" })
  bar0!: string & Opt;

  @Property({ default: 'test' })
  bar1!: string & Opt;

  @Property({ default: 1 })
  num!: number & Opt;

  @Property({ default: true })
  bool!: boolean & Opt;

}

@Entity()
class Foo0 extends Foo {

  @Property({ defaultRaw: sql.now() })
  bar2!: Opt<Date>;

  @Property({ default: sql.now(6), length: 6 })
  bar3!: Date & Opt;

}

@Entity()
class Foo1 extends Foo {

  @Property({ default: sql.now() })
  bar2!: Date;

  // test that we can infer the Date type from default here too
  @Property({ default: sql.now(6), type: 'any', length: 6 })
  bar3!: Date;

  @Property({ type: 'json', default: JSON.stringify({ value: 42 }) })
  metadata!: any;

}

@Entity()
class Foo2 extends Foo {

  @Property({ default: sql.now() })
  bar2!: Date;

  @Property({ default: sql.now(), length: 6 })
  bar3!: Date;

  @Property({ type: 'json', default: JSON.stringify({ value: 42 }) })
  metadata!: any;

}

@Entity()
class Foo3 extends Foo {

  @Property({ default: sql.now() })
  bar2!: Date;

  @Property({ type: 'json', default: JSON.stringify({ value: 43 }) })
  metadata!: any;

}

describe('diffing default values (GH #2385)', () => {

  test('string defaults do not produce additional diffs [mysql]', async () => {
    const orm = await MikroORM.init({
      entities: [Foo0],
      dbName: 'mikro_orm_test_gh_2385',
      driver: MySqlDriver,
      port: 3308,
      metadataProvider: TsMorphMetadataProvider,
      metadataCache: { enabled: false },
    });
    await orm.schema.refreshDatabase();
    expect(await orm.schema.getCreateSchemaSQL()).toMatchSnapshot();
    await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');
    await orm.close();
  });

  test('string defaults do not produce additional diffs [mariadb]', async () => {
    const orm = await MikroORM.init({
      entities: [Foo1],
      dbName: 'mikro_orm_test_gh_2385',
      metadataProvider: ReflectMetadataProvider,
      driver: MariaDbDriver,
      port: 3309,
    });
    await orm.schema.refreshDatabase();
    expect(await orm.schema.getCreateSchemaSQL()).toMatchSnapshot();
    await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');
    await orm.close();
  });

  test('string defaults do not produce additional diffs [postgres]', async () => {
    const orm = await MikroORM.init({
      entities: [Foo2],
      metadataProvider: ReflectMetadataProvider,
      dbName: 'mikro_orm_test_gh_2385',
      driver: PostgreSqlDriver,
    });
    await orm.schema.refreshDatabase();
    expect(await orm.schema.getCreateSchemaSQL()).toMatchSnapshot();
    await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');
    await orm.close();
  });

  test('string defaults do not produce additional diffs [sqlite]', async () => {
    const orm = await MikroORM.init({
      entities: [Foo3],
      metadataProvider: ReflectMetadataProvider,
      dbName: ':memory:',
      driver: SqliteDriver,
    });
    await orm.schema.createSchema();
    expect(await orm.schema.getCreateSchemaSQL()).toMatchSnapshot();
    await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');
    await orm.close();
  });

});
