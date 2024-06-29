import { Entity, Enum, MikroORM, PrimaryKey, Property } from '@mikro-orm/postgresql';

enum SomeEnum {
  FOO = 'Foo',
  BAR = 'Bar',
}

// GH #5751
enum TestEnum {
  Yes = 'Y',
  No = '',
}

@Entity({ tableName: 'author' })
class Author0 {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Enum(() => SomeEnum)
  someEnum!: SomeEnum;

  @Enum(() => TestEnum)
  testEnum!: TestEnum;

}

@Entity({ tableName: 'author' })
class Author1 {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Enum({ items: () => SomeEnum, comment: 'this is a comment' })
  someEnum!: SomeEnum;

  @Enum(() => TestEnum)
  testEnum!: TestEnum;

}

test('GH #4112 and #5751', async () => {
  const orm = await MikroORM.init({
    entities: [Author0],
    dbName: `mikro_orm_test_enum_diffing`,
  });
  await orm.schema.refreshDatabase();

  orm.getMetadata().reset('Author0');
  await orm.discoverEntity([Author1]);
  const diff1 = await orm.schema.getUpdateSchemaSQL({ wrap: false });
  expect(diff1.trim()).toBe(`comment on column "author"."some_enum" is 'this is a comment';`);
  await orm.schema.execute(diff1);

  await orm.close(true);
});
