import { unlinkSync } from 'fs';
import { Entity, PrimaryKey, Property, MikroORM, ReflectMetadataProvider } from '../../lib';
import { SqliteDriver } from '../../lib/drivers/SqliteDriver';

@Entity()
class A {

  @PrimaryKey()
  id!: number;

  @Property({ default: -1 })
  foo!: number;

  @Property({ default: "'baz'" })
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
      metadataProvider: ReflectMetadataProvider,
      cache: { enabled: false },
    });
    await orm.getSchemaGenerator().ensureDatabase();
    await orm.getSchemaGenerator().dropSchema();
    await orm.getSchemaGenerator().createSchema();
  });

  afterAll(async () => {
    await orm.close(true);
    unlinkSync(orm.config.get('dbName'));
  });

  test(`schema updates respect default values`, async () => {
    const generator = orm.getSchemaGenerator();
    const dump = await generator.getUpdateSchemaSQL(false);
    expect(dump).toBe('');
  });

});
