import { Collection, Entity, OneToMany, MikroORM, PrimaryKey, Property, ManyToOne } from '@mikro-orm/postgresql';
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
    dbName: '4973',
  });
  await orm.schema.refreshDatabase();
});

afterAll(() => orm.close(true));

test('GH #4973', async () => {
  const mock = mockLogger(orm);
  await orm.em.findAll(User, {
    where: { books: { parameters: { seasons: { $contains: [{ name: 'summer' }] } } } },
    populate: ['books'],
    strategy: 'select-in',
  });
  expect(mock.mock.calls[0][0]).toMatch(`select "u0".* from "user" as "u0" left join "book" as "b1" on "u0"."id" = "b1"."user_id" where "b1"."parameters"->'seasons' @> '[{"name":"summer"}]'`);
});
