import {
  Collection,
  DateType,
  Entity,
  ManyToOne,
  MikroORM,
  OneToMany,
  OneToOne,
  PrimaryKey,
  Property,
  Ref,
  ref,
} from '@mikro-orm/sqlite';
import { v4 } from 'uuid';

@Entity()
class Author {

  @PrimaryKey()
  id: string = v4();

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
    formula: alias =>
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
  firstBook!: Ref<Book>;

  constructor(name: string) {
    this.name = name;
    const myFirstBook = new Book(new Date(), 'My first book', this);
    this.books.add(myFirstBook);
    this.firstBook = ref(myFirstBook);
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
    this.author = ref(author);
  }

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Author, Book],
    dbName: ':memory:',
  });
  await orm.schema.createSchema();
});

afterAll(() => orm.close(true));

test(`GH issue 1079`, async () => {
  const author = new Author('John');
  await orm.em.persistAndFlush(author);
});
