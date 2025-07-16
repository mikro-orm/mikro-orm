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

@Entity({ tableName: 'author' })
class Author2 {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Enum({ items: () => SomeEnum, default: SomeEnum.FOO })
  someEnum: SomeEnum = SomeEnum.FOO;

  @Enum(() => TestEnum)
  testEnum!: TestEnum;

}

@Entity({ tableName: 'author' })
class Author3 {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Enum({ items: () => SomeEnum, nullable: true })
  someEnum: SomeEnum | null = null;

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

test('Enum diffing: adding default value', async () => {
  const orm = await MikroORM.init({
    entities: [Author1],
    dbName: `mikro_orm_test_enum_diffing`,
  });
  await orm.schema.refreshDatabase();

  orm.getMetadata().reset('Author1');
  await orm.discoverEntity([Author2]);
  const diff1 = await orm.schema.getUpdateSchemaSQL({ wrap: false });

  expect(diff1.trim()).toContain(`alter table "author" alter column "some_enum" set default 'Foo';`);

  await orm.close(true);
});

test('Enum diffing: removing default value', async () => {
  const orm = await MikroORM.init({
    entities: [Author2],
    dbName: `mikro_orm_test_enum_diffing`,
  });
  await orm.schema.refreshDatabase();

  orm.getMetadata().reset('Author2');
  await orm.discoverEntity([Author0]);
  const diff1 = await orm.schema.getUpdateSchemaSQL({ wrap: false });

  expect(diff1.trim()).toContain(`alter table "author" alter column "some_enum" drop default;`);

  await orm.close(true);
});

test('Enum diffing: adding nullable', async () => {
  const orm = await MikroORM.init({
    entities: [Author0],
    dbName: `mikro_orm_test_enum_diffing`,
  });
  await orm.schema.refreshDatabase();

  orm.getMetadata().reset('Author0');
  await orm.discoverEntity([Author3]);
  const diff1 = await orm.schema.getUpdateSchemaSQL({ wrap: false });

  expect(diff1.trim()).toContain(`alter table "author" alter column "some_enum" drop not null;`);

  await orm.close(true);
});

test('Enum diffing: removing nullable', async () => {
  const orm = await MikroORM.init({
    entities: [Author3],
    dbName: `mikro_orm_test_enum_diffing`,
  });
  await orm.schema.refreshDatabase();

  orm.getMetadata().reset('Author3');
  await orm.discoverEntity([Author0]);
  const diff1 = await orm.schema.getUpdateSchemaSQL({ wrap: false });

  expect(diff1.trim()).toContain(`alter table "author" alter column "some_enum" set not null;`);

  await orm.close(true);
});
