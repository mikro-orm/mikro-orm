import { Collection, Entity, OneToMany, PrimaryKey, Property, ManyToOne, LoadStrategy } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/postgresql';
import { mockLogger } from '../helpers';

@Entity()
export class User {

  @PrimaryKey()
  id!: number;

  @OneToMany(() => Book, book => book.user)
  books = new Collection<Book>(this);

}

@Entity()
export class Book {

  @PrimaryKey()
  id!: number;

  @Property({ type: 'jsonb' })
  parameters!: BooksParameters;

  @ManyToOne(() => User)
  user!: User;

}

interface BooksParameters {
  seasons: SeasonType[];
}

interface SeasonType {
  name: string;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [User, Book],
    dbName: ':memory:',
  });
  await orm.schema.refreshDatabase();
});

afterAll(() => orm.close(true));

test('GH #4973', async () => {
  const mock = mockLogger(orm);
  const where = { books: { parameters: { seasons: { $contains: [{ name: 'summer' }] } } } };
  await orm.em.find(User, where, {
    populate: ['books'],
    strategy: LoadStrategy.SELECT_IN,
  });
  expect(mock.mock.calls[0][0]).toMatch(`select "u0".* from "user" as "u0" left join "book" as "b1" on "u0"."id" = "b1"."user_id" where "b1"."parameters"->'seasons' @> '[{"name":"summer"}]'`);
});
