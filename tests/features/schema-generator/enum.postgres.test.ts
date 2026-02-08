import { EntityCaseNamingStrategy, MikroORM } from '@mikro-orm/postgresql';

import { Entity, Enum, PrimaryKey, Property, ReflectMetadataProvider, Unique } from '@mikro-orm/decorators/legacy';
enum Food {
  Waffles = 'Waffles',
  Pancakes = 'Pancakes',
  Muffins = 'Muffins',
  MuffinsOrPancakes = 'Muffins,Pancakes',
}

enum Num {
  A,
  B,
  C,
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
    metadataProvider: ReflectMetadataProvider,
    entities: [Something],
    dbName: `mikro_orm_test_enum1`,
    namingStrategy: EntityCaseNamingStrategy,
  });

  await orm.schema.refresh();

  const diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
  expect(diff).toBe('');

  await orm.close(true);
});

test('numeric enum diffing (GH issue #2932)', async () => {
  const orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [MessageThread],
    dbName: 'mikro_orm_test_enum2',
  });

  await orm.schema.refresh();

  const diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
  expect(diff).toBe('');

  await orm.close(true);
});
