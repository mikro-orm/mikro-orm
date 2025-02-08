import { Entity, MikroORM, PrimaryKey, Property } from '@mikro-orm/sqlite';

interface BookData {
  title: string;
}

@Entity()
class Book {

  @PrimaryKey()
  id!: string;

  @Property({ type: 'object' })
  data!: BookData;

}

test(`GH issue 3221`, async () => {
  const orm = await MikroORM.init({
    entities: [Book],
    dbName: ':memory:',
  });

  const newBook = orm.em.create(Book, {
    id: 'testId',
    data: {
      title: 'testTitle',
    },
  });

  const result = { status: 'OK', data: newBook };
  expect(JSON.stringify(result)).toBe('{"status":"OK","data":{"id":"testId","data":{"title":"testTitle"}}}');

  await orm.close(true);
});
