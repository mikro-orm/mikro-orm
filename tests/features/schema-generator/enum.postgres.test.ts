import { Entity, EntityCaseNamingStrategy, Enum, MikroORM, PrimaryKey } from '@mikro-orm/core';

enum Food {
  Waffles = 'Waffles',
  Pancakes = 'Pancakes',
  Muffins = 'Muffins',
}

@Entity()
export class Something {

  @PrimaryKey()
  id!: number;

  @Enum({ items: () => Food })
  favoriteFood!: Food;

}

describe('GH issue #2938', () => {

  test('enum diffing with case sensitive column names', async () => {
    const orm = await MikroORM.init({
      entities: [Something],
      dbName: `mikro_orm_test_enum1`,
      type: 'postgresql',
      namingStrategy: EntityCaseNamingStrategy,
    });

    await orm.getSchemaGenerator().refreshDatabase();

    const diff = await orm.getSchemaGenerator().getUpdateSchemaSQL({ wrap: false });
    expect(diff).toBe('');

    await orm.close(true);
  });

});
