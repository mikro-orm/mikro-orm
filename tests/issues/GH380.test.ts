import { Entity, PrimaryKey, Property, MikroORM } from '@mikro-orm/core';
import type { SqliteDriver } from '@mikro-orm/sqlite';

@Entity()
class A {

  @PrimaryKey()
  id!: number;

  @Property({ default: -1 })
  foo!: number;

  @Property({ default: 'baz' })
  bar!: string;

}

describe('GH issue 380', () => {

  let orm: MikroORM<SqliteDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [A],
      dbName: `mikro_orm_test_gh_380`,
      type: 'postgresql',
    });
    await orm.getSchemaGenerator().ensureDatabase();
    await orm.getSchemaGenerator().dropSchema();
    await orm.getSchemaGenerator().createSchema();
  });

  afterAll(() => orm.close(true));

  test(`schema updates respect default values`, async () => {
    const generator = orm.getSchemaGenerator();
    const dump = await generator.getUpdateSchemaSQL({ wrap: false });
    expect(dump).toBe('');
  });

});
