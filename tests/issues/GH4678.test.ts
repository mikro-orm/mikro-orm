import {
  Collection,
  Entity,
  OneToMany,
  MikroORM,
  PrimaryKey,
  Property,
  ManyToOne,
} from '@mikro-orm/postgresql';
import { mockLogger } from '../helpers.js';

@Entity()
class User {

  @PrimaryKey()
  id!: number;

  @OneToMany(() => Book, book => book.user)
  books = new Collection<Book>(this);

}

@Entity()
class Book {

  @PrimaryKey()
  id!: number;

  @Property({ type: 'jsonb' })
  parameters!: BooksParameters;

  @Property({ type: 'jsonb' })
  authors!: string[];

  @ManyToOne(() => User)
  user!: User;

}

interface BooksParameters {
  pages: number;
  seasons: SeasonType[];
}


interface SeasonType {
  name: string;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [User, Book],
    dbName: '4678',
  });
  await orm.schema.refreshDatabase();
});

afterAll(() => orm.close(true));


test('GH #4678 ($hasKey operator)', async () => {
  const mock = mockLogger(orm);
  await orm.em.findAll(Book, {
    where: { parameters: { $hasKey: 'seasons' } },
  });
  await orm.em.findAll(User, {
    where: {
      books: { parameters: { $hasKey: 'seasons' } },
    },
    populate: ['books'],
    strategy: 'select-in',
  });

  await orm.em.findAll(Book, {
    where: { authors: { $hasKey: 'Lewis Carroll' } },
  });

  expect(mock.mock.calls[0][0]).toMatch(
    `select "b0".* from "book" as "b0" where "b0"."parameters" ? 'seasons'`,
  );
  expect(mock.mock.calls[1][0]).toMatch(
    `select "u0".* from "user" as "u0" left join "book" as "b1" on "u0"."id" = "b1"."user_id" where "b1"."parameters" ? 'seasons'`,
  );
  expect(mock.mock.calls[2][0]).toMatch(
    `select "b0".* from "book" as "b0" where "b0"."authors" ? 'Lewis Carroll'`,
  );
});

test('GH #4678 ($hasSomeKeys operator)', async () => {
  const mock = mockLogger(orm);
  await orm.em.findAll(Book, {
    where: { parameters: { $hasSomeKeys: ['seasons', 'pages'] } },
  });
  await orm.em.findAll(User, {
    where: {
      books: { parameters: { $hasSomeKeys: ['seasons', 'pages'] } },
    },
    populate: ['books'],
    strategy: 'select-in',
  });
  await orm.em.findAll(Book, {
    where: { authors: { $hasSomeKeys: ['Lewis Carroll', 'Stephen King'] } },
  });

  expect(mock.mock.calls[0][0]).toMatch(
    `select "b0".* from "book" as "b0" where "b0"."parameters" ?| '{seasons,pages}'`,
  );
  expect(mock.mock.calls[1][0]).toMatch(
    `select "u0".* from "user" as "u0" left join "book" as "b1" on "u0"."id" = "b1"."user_id" where "b1"."parameters" ?| '{seasons,pages}'`,
  );
  expect(mock.mock.calls[2][0]).toMatch(
    `select "b0".* from "book" as "b0" where "b0"."authors" ?| '{Lewis Carroll,Stephen King}'`,
  );

});

test('GH #4678 ($hasKeys operator)', async () => {
  const mock = mockLogger(orm);
  await orm.em.findAll(Book, {
    where: { parameters: { $hasKeys: ['seasons', 'pages'] } },
  });
  await orm.em.findAll(User, {
    where: {
      books: { parameters: { $hasKeys: ['seasons', 'pages'] } },
    },
    populate: ['books'],
    strategy: 'select-in',
  });
  await orm.em.findAll(Book, {
    where: { authors: { $hasKeys: ['Lewis Carroll', 'Stephen King'] } },
  });
  expect(mock.mock.calls[0][0]).toMatch(
    `select "b0".* from "book" as "b0" where "b0"."parameters" ?& '{seasons,pages}'`,
  );
  expect(mock.mock.calls[1][0]).toMatch(
    `select "u0".* from "user" as "u0" left join "book" as "b1" on "u0"."id" = "b1"."user_id" where "b1"."parameters" ?& '{seasons,pages}'`,
  );
  expect(mock.mock.calls[2][0]).toMatch(
    `select "b0".* from "book" as "b0" where "b0"."authors" ?& '{Lewis Carroll,Stephen King}'`,
  );
});
