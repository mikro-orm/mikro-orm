import {
  Cursor,
  Entity,
  FilterQuery,
  MikroORM,
  ManyToOne,
  PrimaryKey,
  Property,
  SimpleLogger,
} from '@mikro-orm/core';
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

  @ManyToOne(() => User, { nullable: true })
  bestFriend?: User;

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
  const users: User[] = [];

  for (let i = 0; i < 50; i++) {
    const u = orm.em.create(User, {
      id: i + 1,
      name: `User ${Math.round((i * 2) % 5 / 2) + 1}`,
      email: `email-${100 - i}`,
      termsAccepted: i % 3 === 0,
      age: Math.round((100 - i) / 2),
    });
    users.push(u);

    if (i % 5 === 4) {
      u.bestFriend = users[i % 5];
    }
  }

  await orm.em.flush();
  orm.em.clear();
});

afterAll(() => orm.close(true));

test('complex cursor based pagination using `first` and `after` (id asc)', async () => {
  const mock = mockLogger(orm, ['query', 'query-params']);
  const where = { $or: [{ termsAccepted: true }, { name: 'User 1' }, { age: { $lte: 30 } }], $not: { name: 'User 2' } } satisfies FilterQuery<User>;
  const orderBy = { name: 'desc', age: 'asc', email: 'asc' } as const;

  // 1. page
  const cursor1 = await orm.em.findByCursor(User, where, {
    first: 10,
    orderBy,
  });
  expect(cursor1).toBeInstanceOf(Cursor);
  expect(cursor1.items).toMatchObject([
    { name: 'User 3', age: 26, email: 'email-51', termsAccepted: false, id: 50 },
    { name: 'User 3', age: 27, email: 'email-53', termsAccepted: false, id: 48 },
    { name: 'User 3', age: 28, email: 'email-56', termsAccepted: false, id: 45 },
    { name: 'User 3', age: 29, email: 'email-58', termsAccepted: true, id: 43 },
    { name: 'User 3', age: 31, email: 'email-61', termsAccepted: true, id: 40 },
    { name: 'User 3', age: 37, email: 'email-73', termsAccepted: true, id: 28 },
    { name: 'User 3', age: 38, email: 'email-76', termsAccepted: true, id: 25 },
    { name: 'User 3', age: 44, email: 'email-88', termsAccepted: true, id: 13 },
    { name: 'User 3', age: 46, email: 'email-91', termsAccepted: true, id: 10 },
    { name: 'User 1', age: 28, email: 'email-55', termsAccepted: true, id: 46 },
  ]);
  expect(cursor1.totalCount).toBe(19);
  expect(cursor1.startCursor).toBe('WyJVc2VyIDMiLDI2LCJlbWFpbC01MSJd');
  expect(cursor1.endCursor).toBe('WyJVc2VyIDEiLDI4LCJlbWFpbC01NSJd');
  expect(cursor1.hasNextPage).toBe(true);
  expect(cursor1.hasPrevPage).toBe(false);
  let queries = mock.mock.calls.map(call => call[0]).sort();
  expect(queries).toEqual([
    '[query] select `u0`.* from `user` as `u0`' +
    " where (`u0`.`terms_accepted` = true or `u0`.`name` = 'User 1' or `u0`.`age` <= 30) and not (`u0`.`name` = 'User 2')" +
    ' order by `u0`.`name` desc, `u0`.`age` asc, `u0`.`email` asc limit 11',
    "[query] select count(*) as `count` from `user` as `u0` where (`u0`.`terms_accepted` = true or `u0`.`name` = 'User 1' or `u0`.`age` <= 30) and not (`u0`.`name` = 'User 2')",
  ]);
  orm.em.clear();
  mock.mockReset();

  // 2. page
  const cursor2 = await orm.em.findByCursor(User, where, {
    first: 10,
    after: cursor1,
    orderBy,
  });
  expect(cursor2).toBeInstanceOf(Cursor);
  expect(cursor2.items).toMatchObject([
    { name: 'User 1', age: 30, email: 'email-60', termsAccepted: false, id: 41 },
    { name: 'User 1', age: 33, email: 'email-65', termsAccepted: false, id: 36 },
    { name: 'User 1', age: 35, email: 'email-70', termsAccepted: true, id: 31 },
    { name: 'User 1', age: 38, email: 'email-75', termsAccepted: false, id: 26 },
    { name: 'User 1', age: 40, email: 'email-80', termsAccepted: false, id: 21 },
    { name: 'User 1', age: 43, email: 'email-85', termsAccepted: true, id: 16 },
    { name: 'User 1', age: 45, email: 'email-90', termsAccepted: false, id: 11 },
    { name: 'User 1', age: 48, email: 'email-95', termsAccepted: false, id: 6 },
    { name: 'User 1', age: 50, email: 'email-100', termsAccepted: true, id: 1 },
  ]);
  expect(cursor2.totalCount).toBe(19);
  expect(cursor2.startCursor).toBe('WyJVc2VyIDEiLDMwLCJlbWFpbC02MCJd');
  expect(cursor2.endCursor).toBe('WyJVc2VyIDEiLDUwLCJlbWFpbC0xMDAiXQ');
  expect(cursor2.hasNextPage).toBe(false);
  expect(cursor2.hasPrevPage).toBe(true);
  queries = mock.mock.calls.map(call => call[0]).sort();
  expect(queries).toEqual([
    '[query] select `u0`.* from `user` as `u0`' +
    " where (`u0`.`terms_accepted` = true or `u0`.`name` = 'User 1' or `u0`.`age` <= 30) and not (`u0`.`name` = 'User 2')" +
    " and `u0`.`name` <= 'User 1' and (`u0`.`name` < 'User 1' or (`u0`.`age` >= 28 and (`u0`.`age` > 28 or `u0`.`email` > 'email-55')))" +
    ' order by `u0`.`name` desc, `u0`.`age` asc, `u0`.`email` asc limit 11',
    "[query] select count(*) as `count` from `user` as `u0` where (`u0`.`terms_accepted` = true or `u0`.`name` = 'User 1' or `u0`.`age` <= 30) and not (`u0`.`name` = 'User 2')",
  ]);
  orm.em.clear();
  mock.mockReset();
});
