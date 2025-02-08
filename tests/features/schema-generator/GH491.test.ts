import { MikroORM, Entity, PrimaryKey, Property } from '@mikro-orm/mariadb';

@Entity()
class FooEntity {

  @PrimaryKey()
  id!: number;

  @Property()
  stringProperty!: string;

  @Property({ nullable: true })
  nullableStringProperty?: string;

  @Property()
  booleanProperty!: boolean;

  @Property({ nullable: true })
  nullableBooleanProperty?: boolean;

  @Property()
  numberProperty!: number;

  @Property({ nullable: true })
  nullableNumberProperty?: number;

}

describe('GH issue 491', () => {

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [FooEntity],
      dbName: `mikro_orm_test_gh_491`,
      port: 3309,
    });
    await orm.schema.refreshDatabase();
  });

  afterAll(() => orm.close(true));

  test(`GH issue 491`, async () => {
    expect(await orm.schema.getUpdateSchemaSQL({ wrap: false })).toBe('');
  });

});
