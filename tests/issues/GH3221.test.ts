import { MikroORM } from '@mikro-orm/sqlite';

import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
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
    metadataProvider: ReflectMetadataProvider,
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
