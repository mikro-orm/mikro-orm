import { Entity, EntityCaseNamingStrategy, Enum, MikroORM, PrimaryKey, Property, Unique } from '@mikro-orm/postgresql';

enum Food {
  Waffles = 'Waffles',
  Pancakes = 'Pancakes',
  Muffins = 'Muffins',
  MuffinsOrPancakes = 'Muffins,Pancakes',
}

enum Num {
  A, B, C,
}

@Entity()
class Something {

  @PrimaryKey()
  id!: number;

  @Enum({ items: () => Food })
  favoriteFood!: Food;

  @Enum({ items: () => Num, columnType: 'int', nullable: true })
  num1?: Num;

  @Enum({ items: () => Num, columnType: 'int4', nullable: true })
  num2?: Num;

  @Enum({ items: () => Num, columnType: 'integer', nullable: true })
  num3?: Num;

}

enum ChatLimitInterval {
  UNKNOWN = 0,
  INSTANT = 1,
  DAILY = 2,
  WEEKLY = 3,
  MONTHLY = 4,
}

@Entity()
@Unique({
  properties: ['interval', 'id'],
})
@Unique({
  properties: ['interval', 'id', 'someVeryVeryVeryVeryVeryVeryVeryLongPropertyName'],
})
class MessageThread {

  @PrimaryKey()
  id!: number;

  @Enum(() => ChatLimitInterval)
  interval!: ChatLimitInterval;

  @Property()
  someVeryVeryVeryVeryVeryVeryVeryLongPropertyName!: string;

}

test('enum diffing with case sensitive column names (GH issue #2938)', async () => {
  const orm = await MikroORM.init({
    entities: [Something],
    dbName: `mikro_orm_test_enum1`,
    namingStrategy: EntityCaseNamingStrategy,
  });

  await orm.schema.refreshDatabase();

  const diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
  expect(diff).toBe('');

  await orm.close(true);
});

test('numeric enum diffing (GH issue #2932)', async () => {
  const orm = await MikroORM.init({
    entities: [MessageThread],
    dbName: 'mikro_orm_test_enum2',
  });

  await orm.schema.refreshDatabase();

  const diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
  expect(diff).toBe('');

  await orm.close(true);
});
