import { Collection, MikroORM } from '@mikro-orm/postgresql';

import { Entity, ManyToOne, OneToMany, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
@Entity({ schema: '*' })
class Author {

  @PrimaryKey()
  id!: number;

  @Property({ unique: true, length: 128 })
  name!: string;

  @OneToMany(() => Book, item => item.author, { orphanRemoval: true })
  books = new Collection<Book>(this);

}

@Entity({ schema: '*' })
class Book {

  @PrimaryKey()
  id!: number;

  @Property({ length: 128 })
  title!: string;

  @ManyToOne({ entity: () => Author, deleteRule: 'cascade' })
  author!: Author;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [Author, Book],
    dbName: '6387',
    schema: 'public',
  });
  await orm.schema.refreshDatabase({ schema: 'my_schema' });
});

afterAll(async () => {
  await orm.close(true);
});

test('GH #6387', async () => {
  orm.em.create(Author, {
    name: 'Author1',
    books: [
      { title: 'Book1' },
      { title: 'Book2' },
    ],
  }, { schema: 'my_schema' });
  await orm.em.flush();

  const em = orm.em.fork({ schema: 'my_schema' });
  const author = await em.findOneOrFail(Author, { name: 'Author1' });
  author.books.removeAll();
  await em.flush();
});
