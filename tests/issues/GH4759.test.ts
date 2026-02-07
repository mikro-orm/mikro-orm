import { Collection, DateType, Ref, ref } from '@mikro-orm/core';
import {
  Entity,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryKey,
  Property,
  ReflectMetadataProvider,
} from '@mikro-orm/decorators/legacy';
import { MikroORM } from '@mikro-orm/postgresql';
import { v4 } from 'uuid';

@Entity()
class Author {

  @PrimaryKey()
  id = v4();

  @Property()
  name!: string;

  @OneToMany({
    entity: () => Book,
    mappedBy: 'author',
  })
  books = new Collection<Book>(this);

  @OneToOne({
    entity: () => Book,
    ref: true,
    formula: (cols, alias) =>
      `(select "b"."id"
      from (
        select "b"."author_id", min("b"."release_date") "release_date"
        from "book" "b"
        where "b"."author_id" = ${alias}."id"
        group by "b"."author_id"
      ) "s1"
      join "book" "b"
      on "b"."author_id" = "s1"."author_id"
      and "b"."release_date" = "s1"."release_date")`,
  })
  firstBook?: Ref<Book>;

  constructor(name: string) {
    this.name = name;
  }

}

@Entity()
class Book {

  @PrimaryKey()
  id = v4();

  @Property({ type: DateType })
  releaseDate!: Date;

  @Property()
  name!: string;

  @ManyToOne({
    entity: () => Author,
    ref: true,
    inversedBy: 'books',
  })
  author!: Ref<Author>;

  constructor(releaseDate: Date = new Date(), name: string, author: Author) {
    this.releaseDate = releaseDate;
    this.name = name;
    this.author = ref((author));
  }

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [Book, Author],
    dbName: '4759',
  });
  await orm.schema.refresh();
});

afterAll(() => orm.close(true));

test(`GH issue 4759`, async () => {
  const author = new Author('John');
  const book1 = new Book(new Date('2023-09-01'), 'My second book', author);
  const book2 = new Book(new Date('2023-01-01'), 'My first book', author);
  await orm.em.fork().persist([author, book1, book2]).flush();

  const authorFound = await orm.em.find(Author, { firstBook: { name: 'My first book' } }, { populate: ['books', 'firstBook'] });
  expect(authorFound[0].firstBook?.$.name).toBe('My first book');
});
