import {
  Cursor,
  Entity,
  FilterQuery,
  MikroORM,
  ManyToOne,
  PrimaryKey,
  Property,
  SimpleLogger,
  Ref,
  ref,
  serialize,
  Options,
} from '@mikro-orm/core';
import { mockLogger } from '../../helpers.js';
import { PLATFORMS } from '../../bootstrap.js';

@Entity()
export class User {

  @PrimaryKey({ name: '_id' })
  id!: number;

  @Property()
  name!: string;

  @Property({ unique: true })
  email!: string;

  @Property()
  age!: number;

  @Property()
  termsAccepted!: boolean;

  @ManyToOne(() => User, { ref: true, nullable: true, deleteRule: 'no action', updateRule: 'no action' })
  bestFriend?: Ref<User>;

}

describe.each(['sqlite', 'mysql', 'postgresql', 'mssql', 'mongo'] as const)('simple cursor based pagination (%s)', type => {

  let orm: MikroORM;

  beforeAll(async () => {
    const options: Options = {};

    if (type === 'mysql') {
      options.port = 3308;
    }

    if (type === 'mssql') {
      options.password = 'Root.Root';
    }

    orm = await MikroORM.init({
      entities: [User],
      dbName: type.includes('sqlite') ? ':memory:' : 'mikro_orm_cursor_complex',
      driver: PLATFORMS[type],
      loggerFactory: SimpleLogger.create,
      ...options,
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
        u.bestFriend = ref(users[i % 5]);
      }
    }

    await orm.em.flush();
    orm.em.clear();
  });

  afterAll(() => orm.close(true));

  test('complex cursor based pagination using `first` and `after` (id asc)', async () => {
    const mock = mockLogger(orm, ['query', 'query-params']);
    const where = { $or: [{ termsAccepted: true }, { name: 'User 1' }, { age: { $lte: 30 } }], name: { $ne: 'User 2' } } satisfies FilterQuery<User>;
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
    expect(queries).toMatchSnapshot();
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
    expect(queries).toMatchSnapshot();
    orm.em.clear();
    mock.mockReset();
  });

  test('complex joined cursor based pagination using `last` and `before` (id asc)', async () => {
    if (type === 'mongo') { // skip in mongo, there are no joins, so we can't order by a relation property
      expect(1).toBe(1);
      return;
    }

    const mock = mockLogger(orm, ['query', 'query-params']);
    const where = { bestFriend: { name: 'User 3' } } satisfies FilterQuery<User>;
    const orderBy = { bestFriend: { email: 'asc', name: 'asc' }, name: 'desc', age: 'asc', email: 'asc' } as const;

    // 1. page
    const cursor1 = await orm.em.findByCursor(User, where, {
      last: 5,
      orderBy,
      populate: ['bestFriend'],
    });
    expect(cursor1).toBeInstanceOf(Cursor);
    expect(serialize(cursor1.items, { populate: ['bestFriend'] })).toMatchObject([
      { bestFriend: { email: 'email-96', name: 'User 3' }, name: 'User 3', age: 38, email: 'email-76' },
      { bestFriend: { email: 'email-96', name: 'User 3' }, name: 'User 3', age: 41, email: 'email-81' },
      { bestFriend: { email: 'email-96', name: 'User 3' }, name: 'User 3', age: 43, email: 'email-86' },
      { bestFriend: { email: 'email-96', name: 'User 3' }, name: 'User 3', age: 46, email: 'email-91' },
      { bestFriend: { email: 'email-96', name: 'User 3' }, name: 'User 3', age: 48, email: 'email-96' },
    ]);
    expect(cursor1.totalCount).toBe(10);
    expect(cursor1.startCursor).toBe('W3siZW1haWwiOiJlbWFpbC05NiIsIm5hbWUiOiJVc2VyIDMifSwiVXNlciAzIiwzOCwiZW1haWwtNzYiXQ');
    expect(cursor1.endCursor).toBe('W3siZW1haWwiOiJlbWFpbC05NiIsIm5hbWUiOiJVc2VyIDMifSwiVXNlciAzIiw0OCwiZW1haWwtOTYiXQ');
    expect(cursor1.hasNextPage).toBe(false);
    expect(cursor1.hasPrevPage).toBe(true);
    let queries = mock.mock.calls.map(call => call[0]).sort();
    expect(queries).toMatchSnapshot();
    orm.em.clear();
    mock.mockReset();

    // 2. page
    const cursor2 = await orm.em.findByCursor(User, where, {
      last: 5,
      before: cursor1,
      orderBy,
      populate: ['bestFriend'],
    });
    expect(cursor2).toBeInstanceOf(Cursor);
    expect(serialize(cursor2.items, { populate: ['bestFriend'] })).toMatchObject([
      { bestFriend: { email: 'email-96', name: 'User 3' }, name: 'User 3', age: 26, email: 'email-51' },
      { bestFriend: { email: 'email-96', name: 'User 3' }, name: 'User 3', age: 28, email: 'email-56' },
      { bestFriend: { email: 'email-96', name: 'User 3' }, name: 'User 3', age: 31, email: 'email-61' },
      { bestFriend: { email: 'email-96', name: 'User 3' }, name: 'User 3', age: 33, email: 'email-66' },
      { bestFriend: { email: 'email-96', name: 'User 3' }, name: 'User 3', age: 36, email: 'email-71' },
    ]);
    expect(cursor2.totalCount).toBe(10);
    expect(cursor2.startCursor).toBe('W3siZW1haWwiOiJlbWFpbC05NiIsIm5hbWUiOiJVc2VyIDMifSwiVXNlciAzIiwyNiwiZW1haWwtNTEiXQ');
    expect(cursor2.endCursor).toBe('W3siZW1haWwiOiJlbWFpbC05NiIsIm5hbWUiOiJVc2VyIDMifSwiVXNlciAzIiwzNiwiZW1haWwtNzEiXQ');
    expect(cursor2.hasNextPage).toBe(true);
    expect(cursor2.hasPrevPage).toBe(false);
    queries = mock.mock.calls.map(call => call[0]).sort();
    expect(queries).toMatchSnapshot();

    orm.em.clear();
    mock.mockReset();
  });
});
