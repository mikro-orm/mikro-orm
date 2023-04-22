import { Entity, MikroORM, PrimaryKey, Property } from '@mikro-orm/core';
import { MySqlDriver } from '@mikro-orm/mysql';
import { MariaDbDriver } from '@mikro-orm/mariadb';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { SqliteDriver } from '@mikro-orm/sqlite';

export class Foo {

  @PrimaryKey()
  id!: number;

  @Property({ defaultRaw: "'test'" })
  bar0!: string;

  @Property({ default: 'test' })
  bar1!: string;

}

@Entity()
export class Foo0 extends Foo {

  @Property({ defaultRaw: 'now()' })
  bar2!: Date;

  @Property({ defaultRaw: 'now(6)', length: 6 })
  bar3!: Date;

}

@Entity()
export class Foo1 extends Foo {

  @Property({ defaultRaw: 'now()' })
  bar2!: Date;

  @Property({ defaultRaw: 'now(6)', length: 6 })
  bar3!: Date;

  @Property({ type: 'json', default: JSON.stringify({ value: 42 }) })
  metadata!: any;

}

@Entity()
export class Foo2 extends Foo {

  @Property({ defaultRaw: 'now()' })
  bar2!: Date;

  @Property({ defaultRaw: 'now()', length: 6 })
  bar3!: Date;

  @Property({ type: 'json', default: JSON.stringify({ value: 42 }) })
  metadata!: any;

}

@Entity()
export class Foo3 extends Foo {

  @Property({ defaultRaw: 'now' })
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
      dbName: ':memory:',
      driver: SqliteDriver,
    });
    await orm.schema.createSchema();
    expect(await orm.schema.getCreateSchemaSQL()).toMatchSnapshot();
    await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');
    await orm.close();
  });

});
