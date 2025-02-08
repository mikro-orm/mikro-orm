import { Entity, MikroORM, PrimaryKey, Property } from '@mikro-orm/postgresql';

@Entity({ tableName: 'book' })
class Book0 {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

}

@Entity({ tableName: 'book', comment: 'this is book\'s table' })
class Book1 {

  @PrimaryKey({ comment: 'this is primary\'s key' })
  id!: number;

  @Property({ comment: 'this is name of book' })
  name!: string;

}

@Entity({ tableName: 'book', comment: 'table comment' })
class Book2 {

  @PrimaryKey({ comment: 'new comment' })
  id!: number;

  @Property({ comment: '' })
  name!: string;

}

@Entity({ tableName: 'book' })
class Book3 {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Book0],
    schema: 'foo',
    dbName: `mikro_orm_test_comments`,
  });
  await orm.schema.refreshDatabase();
});

afterAll(() => orm.close(true));

test('comment diffing in postgres', async () => {
  orm.discoverEntity(Book1, 'Book0');
  const diff1 = await orm.schema.getUpdateSchemaSQL({ wrap: false });
  expect(diff1).toMatchSnapshot();
  await orm.schema.execute(diff1);

  orm.discoverEntity(Book2, 'Book1');
  const diff2 = await orm.schema.getUpdateSchemaSQL({ wrap: false });
  expect(diff2).toMatchSnapshot();
  await orm.schema.execute(diff2);

  orm.discoverEntity(Book3, 'Book2');
  const diff3 = await orm.schema.getUpdateSchemaSQL({ wrap: false });
  expect(diff3).toMatchSnapshot();
  await orm.schema.execute(diff3);

  await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');
});
