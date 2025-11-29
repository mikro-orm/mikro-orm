import { Collection, MikroORM } from '@mikro-orm/sqlite';

import { Entity, Filter, ManyToOne, OneToMany, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
@Entity()
class Author {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @OneToMany(() => Book, b => b.author)
  books = new Collection<Book>(this);

  @OneToMany(() => Book, b => b.author)
  favoriteBooks = new Collection<Book>(this);

  @OneToMany(() => Book, b => b.author)
  fictionBooks = new Collection<Book>(this);

}

@Entity()
@Filter({
  name: 'favoriteFilter', cond: args => {
    return { isFavorite: true };
  },
})
@Filter({
  name: 'fictionFilter', cond: args => {
    return { isFiction: true };
  },
})
class Book {

  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

  @Property()
  isFavorite!: boolean;

  @Property()
  isFiction!: boolean;

  @ManyToOne()
  author!: Author;

  @Property()
  pageLength!: number;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: ':memory:',
    entities: [Author, Book],
  });
  await orm.schema.refreshDatabase();

  await orm.em.insert(Author, { id: 1, name: 'Foo' });
  await orm.em.insertMany(Book, [
    { id: 1, title: 'Book1', author: 1, isFavorite: false, isFiction: false, pageLength: 1 },
    { id: 2, title: 'Book2', author: 1, isFavorite: false, isFiction: true, pageLength: 1 },
    { id: 3, title: 'Book3', author: 1, isFavorite: true, isFiction: false, pageLength: 1 },
    { id: 4, title: 'Book4', author: 1, isFavorite: true, isFiction: true, pageLength: 1 },
  ]);
});

afterAll(async () => {
  await orm.close(true);
});

test('partial loading disables propagation (GH #6732)', async () => {
  const author = (await orm.em.findOne(Author, { id: 1 }))!;
  await author.books.init({
    where: { isFiction: true },
  });
  const nonFictionBooks = await orm.em.find(Book, { isFiction: false }); // or author.books.matching({where: {isFiction: false}})

  author.books.getItems().forEach(b => expect(b.isFiction).toBeTruthy());
});

test('partial loading via filters disables propagation (GH #6732)', async () => {
  const author = (await orm.em.findOne(Author, { id: 1 }))!;
  await orm.em.populate(author, ['favoriteBooks'], { filters: { favoriteFilter: {} } });
  await orm.em.populate(author, ['fictionBooks'], { filters: { fictionFilter: {} } });

  author.favoriteBooks.getItems().forEach(b => expect(b.isFavorite).toBeTruthy());
  author.fictionBooks.getItems().forEach(b => expect(b.isFiction).toBeTruthy());
});
