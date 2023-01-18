import { Entity, PrimaryKey, Property, MikroORM } from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';

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

  let orm: MikroORM<PostgreSqlDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [A],
      dbName: `mikro_orm_test_gh_380`,
      driver: PostgreSqlDriver,
    });
    await orm.schema.ensureDatabase();
    await orm.schema.dropSchema();
    await orm.schema.createSchema();
  });

  afterAll(() => orm.close(true));

  test(`schema updates respect default values`, async () => {
    const generator = orm.schema;
    const dump = await generator.getUpdateSchemaSQL({ wrap: false });
    expect(dump).toBe('');
  });

});
