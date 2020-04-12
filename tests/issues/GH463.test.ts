import { unlinkSync } from 'fs';
import { Entity, PrimaryKey, Property, MikroORM, ReflectMetadataProvider, Index, Unique } from '@mikro-orm/core';
import { SqliteDriver } from '@mikro-orm/sqlite';
import { SchemaGenerator } from '@mikro-orm/knex';

abstract class A {

  @PrimaryKey()
  id!: number;

  @Index()
  @Property()
  foo?: string;

  @Unique()
  @Property()
  bar?: string;

}

@Entity()
class B extends A {

  @Property()
  name!: string;

}

describe('GH issue 463', () => {

  let orm: MikroORM<SqliteDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [A, B],
      dbName: __dirname + '/../../temp/mikro_orm_test_gh463.db',
      debug: false,
      highlight: false,
      type: 'sqlite',
      metadataProvider: ReflectMetadataProvider,
      cache: { enabled: false },
    });
    await new SchemaGenerator(orm.em).dropSchema();
    await new SchemaGenerator(orm.em).createSchema();
  });

  afterAll(async () => {
    await orm.close(true);
    unlinkSync(orm.config.get('dbName')!);
  });

  test(`multiple inheritance`, async () => {
    const sql = 'create table `b` (`id` integer not null primary key autoincrement, `foo` varchar not null, `bar` varchar not null, `name` varchar not null);\n' +
      'create index `b_foo_index` on `b` (`foo`);\n' +
      'create unique index `b_bar_unique` on `b` (`bar`);\n\n';
    expect(await new SchemaGenerator(orm.em).getCreateSchemaSQL(false)).toBe(sql);
  });

});
