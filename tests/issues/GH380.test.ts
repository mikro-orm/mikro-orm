import { MikroORM } from '@mikro-orm/postgresql';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

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

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [A],
      dbName: `mikro_orm_test_gh_380`,
    });
    await orm.schema.refresh();
  });

  afterAll(() => orm.close(true));

  test(`schema updates respect default values`, async () => {
    const dump = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(dump).toBe('');
  });

});
