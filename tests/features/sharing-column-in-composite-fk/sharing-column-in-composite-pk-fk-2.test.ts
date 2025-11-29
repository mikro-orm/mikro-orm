import { MikroORM } from '@mikro-orm/sqlite';
import { Entity, ManyToOne, OneToMany, PrimaryKey, Property, ReflectMetadataProvider, Unique } from '@mikro-orm/decorators/legacy';
import { v4 } from 'uuid';
import { Collection, PrimaryKeyProp, Ref } from '@mikro-orm/core';

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
    deleteRule: 'cascade',
    primary: true,
    joinColumns: ['book_id', 'company_id'],
  })
  book!: Ref<Book>;

}

@Entity()
class Book {

  [PrimaryKeyProp]?: ['id', 'company'];

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
    deleteRule: 'cascade',
    joinColumns: ['book_id', 'company_id'],
  })
  book!: Ref<Book>;

  @ManyToOne({ entity: () => User, ref: true })
  user!: Ref<User>;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
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
