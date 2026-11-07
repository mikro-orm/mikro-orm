import { defineEntity, type IDatabaseDriver, MikroORM, Opt, p, sql } from '@mikro-orm/core';
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
    await orm.schema.refresh();
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
    await orm.schema.refresh();
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
    await orm.schema.refresh();
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
    await orm.schema.create();
    expect(await orm.schema.getCreateSchemaSQL()).toMatchSnapshot();
    await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');
    await orm.close();
  });
});

// metadata quotes bigint defaults (`'0'`) while mysql and mariadb report them bare
const BigIntDefaults = defineEntity({
  name: 'BigIntDefaults',
  properties: {
    id: p.integer().primary(),
    big: p.bigint().default(0),
    negative: p.bigint('number').default(-5),
    huge: p.bigint().default('9007199254740993'),
    code: p.string().default('007'),
  },
});

const ChangedBigIntDefaults = defineEntity({
  name: 'BigIntDefaults',
  properties: {
    id: p.integer().primary(),
    big: p.bigint().default(1),
    negative: p.bigint('number').default(-5),
    // differs from the stored default only beyond Number.MAX_SAFE_INTEGER
    huge: p.bigint().default('9007199254740992'),
    // a numeric-looking string default is still compared as text
    code: p.string().default('7'),
  },
});

const options = {
  mysql: { driver: MySqlDriver, port: 3308 },
  mariadb: { driver: MariaDbDriver, port: 3309 },
} as const;

describe.each(['mysql', 'mariadb'] as const)('bigint defaults [%s]', type => {
  const dbName = 'mikro_orm_test_bigint_defaults';
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init<IDatabaseDriver>({ ...options[type], entities: [BigIntDefaults], dbName });
    await orm.schema.refresh();
  });

  afterAll(() => orm.close(true));

  test('do not produce additional diffs', async () => {
    await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');
  });

  test('still diff a changed value', async () => {
    const changed = await MikroORM.init<IDatabaseDriver>({
      ...options[type],
      entities: [ChangedBigIntDefaults],
      dbName,
    });
    const diff = await changed.schema.getUpdateSchemaSQL({ wrap: false });
    await changed.close(true);
    expect(diff).toBe(
      [
        "alter table `big_int_defaults` modify `big` bigint not null default '1';",
        "alter table `big_int_defaults` modify `huge` bigint not null default '9007199254740992';",
        "alter table `big_int_defaults` modify `code` varchar(255) not null default '7';",
        '',
      ].join('\n'),
    );
  });
});
