import { Entity, PrimaryKey, Property, MikroORM, ReflectMetadataProvider, EntityCaseNamingStrategy } from '../../lib';
import { SqliteDriver } from '../../lib/drivers/SqliteDriver';

@Entity()
class A {

  @PrimaryKey()
  id!: string;

  @Property()
  prop?: string;

}

describe('GH issue 472', () => {

  let orm: MikroORM<SqliteDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [A],
      dbName: 'mikro_orm_test_gh472',
      type: 'postgresql',
      metadataProvider: ReflectMetadataProvider,
      namingStrategy: EntityCaseNamingStrategy,
      cache: { enabled: false },
    });
    await orm.getSchemaGenerator().ensureDatabase();
    await orm.getSchemaGenerator().dropSchema();
    await orm.getSchemaGenerator().createSchema();
  });

  afterAll(async () => await orm.close(true));

  test(`case sensitive table names`, async () => {
    await expect(orm.getSchemaGenerator().updateSchema()).resolves.toBeUndefined();
    await orm.getSchemaGenerator().dropDatabase(orm.config.get('dbName'));
  });

});
