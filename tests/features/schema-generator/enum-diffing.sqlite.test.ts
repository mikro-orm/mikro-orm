import { Entity, Enum, MikroORM, PrimaryKey, Property } from '@mikro-orm/libsql';

enum SomeEnum {
  FOO = 'Foo',
  BAR = 'Bar',
}

enum SomeEnum2 {
  FOO = 'Foo',
  BAR = 'Bar',
  BAZ = 'Baz',
}

@Entity({ tableName: 'author' })
class Author0 {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Enum(() => SomeEnum)
  someEnum!: SomeEnum;

}

@Entity({ tableName: 'author' })
class Author1 {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Enum({ items: () => SomeEnum2 })
  someEnum!: SomeEnum2;

}

test('GH #5672', async () => {
  const orm = await MikroORM.init({
    entities: [Author0],
    dbName: `:memory:`,
  });
  await orm.schema.refreshDatabase();

  orm.discoverEntity(Author1, 'Author0');
  const diff1 = await orm.schema.getUpdateSchemaSQL({ wrap: false });
  expect(diff1.trim()).toMatchSnapshot();
  await orm.schema.execute(diff1);

  await orm.close(true);
});
