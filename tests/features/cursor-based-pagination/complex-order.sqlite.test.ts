import { Cursor, Entity, MikroORM, PrimaryKey, Property, SimpleLogger } from '@mikro-orm/core';
import { SqliteDriver } from '@mikro-orm/sqlite';
import { mockLogger } from '../../helpers';

@Entity()
export class User {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Property()
  email!: string;

  @Property()
  age!: number;

  @Property()
  termsAccepted!: boolean;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [User],
    dbName: ':memory:',
    driver: SqliteDriver,
    loggerFactory: options => new SimpleLogger(options),
  });
  await orm.schema.refreshDatabase();

  for (let i = 0; i < 50; i++) {
    orm.em.create(User, {
      name: `User ${Math.round((i * 2) % 5 / 2) + 1}`,
      email: `email-${100 - i}`,
      termsAccepted: i % 3 === 0,
      age: Math.round((100 - i) / 2),
    });
  }

  await orm.em.flush();
  orm.em.clear();
});

afterAll(() => orm.close(true));

test('complex cursor based pagination using `first` and `after` (id asc)', async () => {
  const mock = mockLogger(orm, ['query', 'query-params']);

  // 1. page
  const cursor1 = await orm.em.findByCursor(User, { termsAccepted: true }, {
    first: 10,
    orderBy: { age: 'asc', name: 'desc', email: 'asc' },
  });
  expect(cursor1).toBeInstanceOf(Cursor);
  expect(cursor1.items).toMatchObject([
    { age: 26, name: 'User 2', email: 'email-52', id: 49, termsAccepted: true },
    { age: 28, name: 'User 1', email: 'email-55', id: 46, termsAccepted: true },
    { age: 29, name: 'User 3', email: 'email-58', id: 43, termsAccepted: true },
    { age: 31, name: 'User 3', email: 'email-61', id: 40, termsAccepted: true },
    { age: 32, name: 'User 2', email: 'email-64', id: 37, termsAccepted: true },
    { age: 34, name: 'User 2', email: 'email-67', id: 34, termsAccepted: true },
    { age: 35, name: 'User 1', email: 'email-70', id: 31, termsAccepted: true },
    { age: 37, name: 'User 3', email: 'email-73', id: 28, termsAccepted: true },
    { age: 38, name: 'User 3', email: 'email-76', id: 25, termsAccepted: true },
    { age: 40, name: 'User 2', email: 'email-79', id: 22, termsAccepted: true },
  ]);
  expect(cursor1.totalCount).toBe(17);
  expect(cursor1.startCursor).toBe('WzI2LCJVc2VyIDIiLCJlbWFpbC01MiJd');
  expect(cursor1.endCursor).toBe('WzQwLCJVc2VyIDIiLCJlbWFpbC03OSJd');
  expect(cursor1.hasNextPage).toBe(true);
  expect(cursor1.hasPrevPage).toBe(false);
  let queries = mock.mock.calls.map(call => call[0]).sort();
  expect(queries).toEqual([
    '[query] select `u0`.* from `user` as `u0` where `u0`.`terms_accepted` = true order by `u0`.`age` asc, `u0`.`name` desc, `u0`.`email` asc limit 11',
    '[query] select count(*) as `count` from `user` as `u0` where `u0`.`terms_accepted` = true',
  ]);
  orm.em.clear();
  mock.mockReset();

  // 2. page
  const cursor2 = await orm.em.findByCursor(User, { termsAccepted: true }, {
    first: 10,
    after: cursor1,
    orderBy: { age: 'asc', name: 'desc', email: 'asc' },
  });
  expect(cursor2).toBeInstanceOf(Cursor);
  expect(cursor2.items).toMatchObject([
    { age: 41, name: 'User 2', email: 'email-82', termsAccepted: true, id: 19 },
    { age: 43, name: 'User 1', email: 'email-85', termsAccepted: true, id: 16 },
    { age: 44, name: 'User 3', email: 'email-88', termsAccepted: true, id: 13 },
    { age: 46, name: 'User 3', email: 'email-91', termsAccepted: true, id: 10 },
    { age: 47, name: 'User 2', email: 'email-94', termsAccepted: true, id: 7 },
    { age: 49, name: 'User 2', email: 'email-97', termsAccepted: true, id: 4 },
    { age: 50, name: 'User 1', email: 'email-100', termsAccepted: true, id: 1 },
  ]);
  expect(cursor2.totalCount).toBe(17);
  expect(cursor2.startCursor).toBe('WzQxLCJVc2VyIDIiLCJlbWFpbC04MiJd');
  expect(cursor2.endCursor).toBe('WzUwLCJVc2VyIDEiLCJlbWFpbC0xMDAiXQ==');
  expect(cursor2.hasNextPage).toBe(false);
  // expect(cursor2.hasPrevPage).toBe(true); // FIXME
  queries = mock.mock.calls.map(call => call[0]).sort();
  expect(queries).toEqual([
    '[query] select `u0`.* from `user` as `u0`' +
    " where `u0`.`terms_accepted` = true and `u0`.`age` >= 40 and (`u0`.`age` > 40 or (`u0`.`name` <= 'User 2' and (`u0`.`name` < 'User 2' or `u0`.`email` > 'email-79')))" +
    ' order by `u0`.`age` asc, `u0`.`name` desc, `u0`.`email` asc limit 11',
    '[query] select count(*) as `count` from `user` as `u0` where `u0`.`terms_accepted` = true',
  ]);
  orm.em.clear();
  mock.mockReset();
});
