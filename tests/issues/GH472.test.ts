import { MikroORM, EntityCaseNamingStrategy } from '@mikro-orm/postgresql';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
class A {
  @PrimaryKey()
  id!: string;

  @Property()
  prop?: string;
}

describe('GH issue 472', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [A],
      dbName: 'mikro_orm_test_gh472',
      namingStrategy: EntityCaseNamingStrategy,
    });
    await orm.schema.refresh();
  });

  afterAll(() => orm.close(true));

  test(`case sensitive table names`, async () => {
    await expect(orm.schema.update()).resolves.toBeUndefined();
    await orm.schema.dropDatabase(orm.config.get('dbName'));
  });
});
