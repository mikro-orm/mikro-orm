import { Collection, Entity, ManyToOne, OneToMany, PrimaryKey, Property, Unique } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/sqlite';

@Entity()
class Author {

  @PrimaryKey()
  id!: number;

  @OneToMany(() => Book, book => book.author, { orphanRemoval: true })
  books = new Collection<Book>(this);

}

@Unique({ properties: ['type', 'title'] })
@Entity()
class Book {

  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Author)
  author!: Author;

  @Property()
  type!: string;

  @Property()
  title!: string;

  @Property()
  color!: string;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Author],
    dbName: `:memory:`,
  });

  await orm.schema.createSchema();

  const author = new Author();
  const book1 = new Book();
  book1.title = 'book1';
  book1.type = 't1';
  book1.color = 'c1';
  author.books.add(book1);
  await orm.em.persistAndFlush(author);
  orm.em.clear();
});

afterAll(() => orm.close(true));

test('#4305', async () => {
  const author = await orm.em.findOne(Author, { id: 1 }, {
    populate: ['books'],
  });

  const newBook = new Book();
  newBook.title = 'book1';
  newBook.type = 't1';
  newBook.color = 'c2';
  author!.books.set([newBook]);
  await orm.em.flush();
});
