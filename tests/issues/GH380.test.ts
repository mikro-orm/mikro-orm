import { unlinkSync } from 'fs';
import { Entity, PrimaryKey, Property, MikroORM, ReflectMetadataProvider } from '@mikro-orm/core';
import { SqliteDriver } from '@mikro-orm/sqlite';
import { SchemaGenerator } from '@mikro-orm/knex';

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
      debug: false,
      highlight: false,
      type: 'postgresql',
    });
    await new SchemaGenerator(orm.em).ensureDatabase();
    await new SchemaGenerator(orm.em).dropSchema();
    await new SchemaGenerator(orm.em).createSchema();
  });

  afterAll(async () => {
    await orm.close(true);
    unlinkSync(orm.config.get('dbName')!);
  });

  test(`schema updates respect default values`, async () => {
    const generator = new SchemaGenerator(orm.em);
    const dump = await generator.getUpdateSchemaSQL(false);
    expect(dump).toBe('');
  });

});
