import { Entity, PrimaryKey, Property, MikroORM } from '@mikro-orm/core';
import type { MariaDbDriver } from '@mikro-orm/mariadb';

@Entity()
export class FooEntity {

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

  let orm: MikroORM<MariaDbDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [FooEntity],
      dbName: `mikro_orm_test_gh_491`,
      type: 'mariadb',
      port: 3309,
    });
    await orm.getSchemaGenerator().ensureDatabase();
    await orm.getSchemaGenerator().dropSchema();
    await orm.getSchemaGenerator().createSchema();
  });

  afterAll(() => orm.close(true));

  test(`GH issue 491`, async () => {
    expect(await orm.getSchemaGenerator().getUpdateSchemaSQL({ wrap: false })).toBe('');
  });

});
