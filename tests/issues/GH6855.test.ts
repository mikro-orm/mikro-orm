import {
  Collection,
  Entity,
  ManyToOne,
  MikroORM,
  OneToMany,
  PrimaryKey,
  Property,
} from "@mikro-orm/sqlite";
import { ref, Reference } from "@mikro-orm/core";

@Entity()
class Author {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @OneToMany(() => Book, (b) => b.author)
  books = new Collection<Book>(this);
}

@Entity()
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

  // This is the collection that isn't correctly initialised when the merge happens.
  @OneToMany({ entity: () => Foo, mappedBy: (foo) => foo.book })
  foos = new Collection<Foo>(this);
}

@Entity()
class Foo {
  @PrimaryKey()
  id!: number;

  @ManyToOne({ entity: () => Book })
  book = new Collection<Book>(this);
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ":memory:",
    entities: [Author, Book],
  });
  await orm.schema.refreshDatabase();

  await orm.em.insert(Author, { id: 1, name: "Foo" });
  await orm.em.insert(Author, { id: 2, name: "Bar" });
  await orm.em.insertMany(Book, [
    {
      id: 1,
      title: "Book1",
      author: 1,
      isFavorite: false,
      isFiction: false,
      pageLength: 1,
    },
    {
      id: 2,
      title: "Book2",
      author: 1,
      isFavorite: false,
      isFiction: true,
      pageLength: 1,
    },
    {
      id: 3,
      title: "Book3",
      author: 2,
      isFavorite: true,
      isFiction: false,
      pageLength: 1,
    },
    {
      id: 4,
      title: "Book4",
      author: 2,
      isFavorite: true,
      isFiction: true,
      pageLength: 1,
    },
  ]);
});

afterAll(async () => {
  await orm.close(true);
});

test("merge in transaction succeeds", async () => {
  await orm.em.transactional(async () => {
    const author = await orm.em.findOne(Author, { id: 1 });

    if (!author) throw new Error("Author not found");

    // This works
    // author.books.add(ref(Book, { id: 4 }));

    // This throws
    // ValidationError: Book.foos is not initialized, define it as 'foos = new Collection<Foo>(this);'
    author.books.add(orm.em.getReference<Book>("Book", 4));

    orm.em.persist(author);
    await orm.em.flush();
  });
});
