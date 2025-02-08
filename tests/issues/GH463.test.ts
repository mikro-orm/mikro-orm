import { Entity, PrimaryKey, Property, MikroORM, Index, Unique } from '@mikro-orm/sqlite';

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

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [A, B],
      dbName: ':memory:',
    });
    await orm.schema.dropSchema();
    await orm.schema.createSchema();
  });

  afterAll(() => orm.close(true));

  test(`multiple inheritance`, async () => {
    const sql = 'create table `b` (`id` integer not null primary key autoincrement, `foo` text not null, `bar` text not null, `name` text not null);\n' +
      'create index `b_foo_index` on `b` (`foo`);\n' +
      'create unique index `b_bar_unique` on `b` (`bar`);\n';
    expect(await orm.schema.getCreateSchemaSQL({ wrap: false })).toBe(sql);
  });

});
