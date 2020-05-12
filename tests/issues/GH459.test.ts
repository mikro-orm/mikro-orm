import { unlinkSync } from 'fs';
import { Entity, PrimaryKey, Property, MikroORM, ReflectMetadataProvider } from '@mikro-orm/core';
import { SqliteDriver } from '@mikro-orm/sqlite';
import { SchemaGenerator } from '@mikro-orm/knex';

abstract class A {

  @PrimaryKey()
  id!: number;

}

abstract class B extends A {

  @Property()
  foo!: string;

}

abstract class C extends B {

  @Property()
  bar!: string;

}

@Entity()
class D extends C {

  @Property()
  name!: string;

}

describe('GH issue 459', () => {

  let orm: MikroORM<SqliteDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [A, B, C, D],
      dbName: __dirname + '/../../temp/mikro_orm_test_gh459.db',
      debug: false,
      highlight: false,
      type: 'sqlite',
    });
    await new SchemaGenerator(orm.em).dropSchema();
    await new SchemaGenerator(orm.em).createSchema();
  });

  afterAll(async () => {
    await orm.close(true);
    unlinkSync(orm.config.get('dbName')!);
  });

  test(`multiple inheritance`, async () => {
    const sql = 'create table `d` (`id` integer not null primary key autoincrement, `foo` varchar not null, `bar` varchar not null, `name` varchar not null);\n\n';
    expect(await new SchemaGenerator(orm.em).getCreateSchemaSQL(false)).toBe(sql);

    const d = new D();
    d.name = 'name';
    d.foo = 'foo';
    d.bar = 'bar';
    await orm.em.persistAndFlush(d);
    orm.em.clear();

    const d1 = await orm.em.findOneOrFail(D, d.id);
    expect(d1).toEqual({ id: d.id, foo: 'foo', bar: 'bar', name: 'name' });
  });

});
