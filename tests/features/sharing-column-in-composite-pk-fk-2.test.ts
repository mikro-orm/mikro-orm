import { MikroORM } from '@mikro-orm/sqlite';
import { v4 } from 'uuid';
import {
  Collection,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryKey,
  PrimaryKeyProp,
  PrimaryKeyType,
  Property,
  Ref,
  Unique,
} from '@mikro-orm/core';

@Entity()
class Company {

  @PrimaryKey({ columnType: 'uuid' })
  id: string = v4();

  @Unique({ name: 'company_name_unique' })
  @Property({ columnType: 'text', length: 255 })
  name!: string;

}

@Entity()
class User {

  @PrimaryKey({ columnType: 'uuid' })
  id: string = v4();

}

@Entity()
class Reader {

  [PrimaryKeyProp]?: ['user_id', 'company_id', 'book_id'];
  [PrimaryKeyType]?: [string, string, string];

  @ManyToOne({
    entity: () => User,
    ref: true,
    primary: true,
  })
  user!: Ref<User>;

  @ManyToOne({
    entity: () => Company,
    ref: true,
    primary: true,
  })
  company!: Ref<Company>;

  @ManyToOne({
    entity: () => Book,
    ref: true,
    onDelete: 'cascade',
    primary: true,
    joinColumns: ['book_id', 'company_id'],
  })
  book!: Ref<Book>;

}

@Entity()
class Book {

  [PrimaryKeyType]?: [string, string];
  [PrimaryKeyProp]?: ['id', 'company_id'];

  @Unique({ name: 'book_id_unique' })
  @PrimaryKey({ columnType: 'uuid' })
  id: string = v4();

  @ManyToOne({
    entity: () => Company,
    ref: true,
    primary: true,
  })
  company!: Ref<Company>;

  @OneToMany({
    entity: () => Reader,
    mappedBy: 'book',
    orphanRemoval: true,
  })
  readers = new Collection<Reader>(this);

  @OneToMany({
    entity: () => BookReviewer,
    mappedBy: 'book',
    orphanRemoval: true,
  })
  reviewers = new Collection<BookReviewer>(this);

}

@Entity()
class BookReviewer {

  [PrimaryKeyType]?: [string, string];

  @Unique({ name: 'book_reviewer_id_unique' })
  @PrimaryKey({ columnType: 'uuid' })
  id: string = v4();

  @ManyToOne({
    entity: () => Company,
    ref: true,
    primary: true,
  })
  company!: Ref<Company>;

  @ManyToOne({
    entity: () => Book,
    ref: true,
    onDelete: 'cascade',
    joinColumns: ['book_id', 'company_id'],
  })
  book!: Ref<Book>;

  @ManyToOne({ entity: () => User, ref: true })
  user!: Ref<User>;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Company, Book, User],
    dbName: `:memory:`,
  });

  await orm.schema.createSchema();
});

afterAll(async () => {
  await orm.close(true);
});

test('sharing column in composite pk + seeding', async () => {
  const company = orm.em.create(Company, { name: 'c' });
  const user = orm.em.create(User, {});
  const book = orm.em.create(Book, { company });
  const reader = orm.em.create(Reader, {
    book: [book.id, company.id],
    company: company.id,
    user: user.id,
  });
  await orm.em.flush();

  const reviewer = orm.em.create(BookReviewer, {
    book: [book.id, company.id],
    company: company.id,
    user: user.id,
  });
  await orm.em.flush();
  expect(reviewer.book.unwrap()).toBe(book);
});
