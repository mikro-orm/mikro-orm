import { Collection, Entity, ManyToMany, MikroORM, PrimaryKey, Property } from '@mikro-orm/postgresql';

@Entity({ tableName: 'tags', schema: '*' })
class Tag {

  @PrimaryKey()
  id!: number;

  @Property({ length: 128 })
  label!: string;

  @ManyToMany(() => Book, book => book.tags)
  books = new Collection<Book>(this);

}

@Entity({ tableName: 'books', schema: '*' })
class Book {

  @PrimaryKey()
  id!: number;

  @Property({ length: 128 })
  title!: string;

  @ManyToMany(() => Tag, tag => tag.books, { owner: true })
  tags = new Collection<Tag>(this);

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Book, Tag],
    dbName: '6516',
    schema: 'public',
  });
  await orm.schema.refreshDatabase({ schema: 'my_schema' });
});

afterAll(async () => {
  await orm.close(true);
});

test('GH #6516', async () => {
  const em = orm.em.fork({ schema: 'my_schema' });
  const tag = em.create(Tag, { label: 'Novel' });
  const book = em.create(Book, { title: 'Book', tags: [tag] });
  await em.flush();
});
