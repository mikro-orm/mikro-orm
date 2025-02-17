import { Cursor, Entity, MikroORM, Options, PrimaryKey, Property, SimpleLogger } from '@mikro-orm/core';
import { mockLogger } from '../../helpers.js';
import { PLATFORMS } from '../../bootstrap.js';

@Entity()
class User {

  @PrimaryKey({ name: '_id' })
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

describe.each(['sqlite', 'mysql', 'postgresql', 'mongo'] as const)('bidrectional cursor based pagination (%s)', type => {

  let orm: MikroORM;

  beforeAll(async () => {
    const options: Options = {};

    if (type === 'mysql') {
      options.port = 3308;
    }

    orm = await MikroORM.init({
      entities: [User],
      dbName: type.includes('sqlite') ? ':memory:' : 'mikro_orm_cursor_bidirectional',
      driver: PLATFORMS[type],
      loggerFactory: SimpleLogger.create,
      ...options,
    });
    await orm.schema.refreshDatabase();

    for (let i = 0; i < 9; i++) {
      orm.em.create(User, {
        id: i + 1,
        name: `User ${i + 1}`,
        email: `email-${100 - i}`,
        termsAccepted: i % 5 === 0,
        age: Math.round((100 - i) / 2),
      });
    }

    await orm.em.flush();
    orm.em.clear();
  });

  afterAll(() => orm.close(true));

  test('using `first` and `after` then backward using `last` and `before` (id asc)', async () => {
    const mock = mockLogger(orm, ['query', 'query-params']);

    // 1. page (first / forward)
    const cursor1 = await orm.em.findByCursor(User, {}, {
      first: 3,
      orderBy: { id: 'asc' },
    });
    expect(cursor1).toBeInstanceOf(Cursor);
    expect(cursor1.items).toMatchObject([
      { id: 1, name: 'User 1' },
      { id: 2, name: 'User 2' },
      { id: 3, name: 'User 3' },
    ]);
    expect(cursor1.totalCount).toBe(9);
    expect(cursor1.startCursor).toBe('WzFd');
    expect(cursor1.endCursor).toBe('WzNd');
    expect(cursor1.hasNextPage).toBe(true);
    expect(cursor1.hasPrevPage).toBe(false);
    let queries = mock.mock.calls.map(call => call[0]).sort();
    expect(queries).toMatchSnapshot();
    orm.em.clear();
    mock.mockReset();

    // 2. page (mid / forward)
    const cursor2 = await orm.em.findByCursor(User, {}, {
      first: 3,
      after: cursor1,
      orderBy: { id: 'asc' },
    });
    expect(cursor2).toBeInstanceOf(Cursor);
    expect(cursor2.items).toMatchObject([
      { id: 4, name: 'User 4' },
      { id: 5, name: 'User 5' },
      { id: 6, name: 'User 6' },
    ]);
    expect(cursor2.totalCount).toBe(9);
    expect(cursor2.startCursor).toBe('WzRd');
    expect(cursor2.endCursor).toBe('WzZd');
    expect(cursor2.hasNextPage).toBe(true);
    expect(cursor2.hasPrevPage).toBe(true);
    queries = mock.mock.calls.map(call => call[0]).sort();
    expect(queries).toMatchSnapshot();
    orm.em.clear();
    mock.mockReset();

    // 3. page (last / forward)
    const cursor3 = await orm.em.findByCursor(User, {}, {
      first: 3,
      after: cursor2,
      orderBy: { id: 'asc' },
    });
    expect(cursor3).toBeInstanceOf(Cursor);
    expect(cursor3.items).toMatchObject([
      { id: 7, name: 'User 7' },
      { id: 8, name: 'User 8' },
      { id: 9, name: 'User 9' },
    ]);
    expect(cursor3.totalCount).toBe(9);
    expect(cursor3.startCursor).toBe('Wzdd');
    expect(cursor3.endCursor).toBe('Wzld');
    expect(cursor3.hasNextPage).toBe(false);
    expect(cursor3.hasPrevPage).toBe(true);
    queries = mock.mock.calls.map(call => call[0]).sort();
    expect(queries).toMatchSnapshot();
    orm.em.clear();
    mock.mockReset();

    // 4. page (mid / backward)
    const cursor4 = await orm.em.findByCursor(User, {}, {
      last: 3,
      before: cursor3,
      orderBy: { id: 'asc' },
    });
    expect(cursor4).toBeInstanceOf(Cursor);
    expect(cursor4.items).toMatchObject([
      { id: 4, name: 'User 4' },
      { id: 5, name: 'User 5' },
      { id: 6, name: 'User 6' },
    ]);
    expect(cursor4.totalCount).toBe(9);
    expect(cursor4.startCursor).toBe('WzRd');
    expect(cursor4.endCursor).toBe('WzZd');
    expect(cursor4.hasNextPage).toBe(true);
    expect(cursor4.hasPrevPage).toBe(true);
    queries = mock.mock.calls.map(call => call[0]).sort();
    expect(queries).toMatchSnapshot();
    orm.em.clear();
    mock.mockReset();

    // 5. page (first / backward)
    const cursor5 = await orm.em.findByCursor(User, {}, {
      last: 3,
      before: cursor4,
      orderBy: { id: 'asc' },
    });
    expect(cursor5).toBeInstanceOf(Cursor);
    expect(cursor5.items).toMatchObject([
      { id: 1, name: 'User 1' },
      { id: 2, name: 'User 2' },
      { id: 3, name: 'User 3' },
    ]);
    expect(cursor5.totalCount).toBe(9);
    expect(cursor5.startCursor).toBe('WzFd');
    expect(cursor5.endCursor).toBe('WzNd');
    expect(cursor5.hasNextPage).toBe(true);
    expect(cursor5.hasPrevPage).toBe(false);
    queries = mock.mock.calls.map(call => call[0]).sort();
    expect(queries).toMatchSnapshot();
    orm.em.clear();
    mock.mockReset();
  });

  test('using `last` and `before` then forward using `first` and `after` (id asc)', async () => {
    const mock = mockLogger(orm, ['query', 'query-params']);

    // 1. page (last / backward)
    const cursor1 = await orm.em.findByCursor(User, {}, {
      last: 3,
      orderBy: { id: 'asc' },
    });
    expect(cursor1).toBeInstanceOf(Cursor);
    expect(cursor1.items).toMatchObject([
      { id: 7, name: 'User 7' },
      { id: 8, name: 'User 8' },
      { id: 9, name: 'User 9' },
    ]);
    expect(cursor1.totalCount).toBe(9);
    expect(cursor1.startCursor).toBe('Wzdd');
    expect(cursor1.endCursor).toBe('Wzld');
    expect(cursor1.hasNextPage).toBe(false);
    expect(cursor1.hasPrevPage).toBe(true);
    let queries = mock.mock.calls.map(call => call[0]).sort();
    expect(queries).toMatchSnapshot();
    orm.em.clear();
    mock.mockReset();

    // 2. page (mid / backward)
    const cursor2 = await orm.em.findByCursor(User, {}, {
      last: 3,
      before: cursor1,
      orderBy: { id: 'asc' },
    });
    expect(cursor2).toBeInstanceOf(Cursor);
    expect(cursor2.items).toMatchObject([
      { id: 4, name: 'User 4' },
      { id: 5, name: 'User 5' },
      { id: 6, name: 'User 6' },
    ]);
    expect(cursor2.totalCount).toBe(9);
    expect(cursor2.startCursor).toBe('WzRd');
    expect(cursor2.endCursor).toBe('WzZd');
    expect(cursor2.hasNextPage).toBe(true);
    expect(cursor2.hasPrevPage).toBe(true);
    queries = mock.mock.calls.map(call => call[0]).sort();
    expect(queries).toMatchSnapshot();
    orm.em.clear();
    mock.mockReset();

    // 3. page (first / backward)
    const cursor3 = await orm.em.findByCursor(User, {}, {
      last: 3,
      before: cursor2,
      orderBy: { id: 'asc' },
    });
    expect(cursor3).toBeInstanceOf(Cursor);
    expect(cursor3.items).toMatchObject([
      { id: 1, name: 'User 1' },
      { id: 2, name: 'User 2' },
      { id: 3, name: 'User 3' },
    ]);
    expect(cursor3.totalCount).toBe(9);
    expect(cursor3.startCursor).toBe('WzFd');
    expect(cursor3.endCursor).toBe('WzNd');
    expect(cursor3.hasNextPage).toBe(true);
    expect(cursor3.hasPrevPage).toBe(false);
    queries = mock.mock.calls.map(call => call[0]).sort();
    expect(queries).toMatchSnapshot();
    orm.em.clear();
    mock.mockReset();

    // 4. page (mid / forward)
    const cursor4 = await orm.em.findByCursor(User, {}, {
      first: 3,
      after: cursor3,
      orderBy: { id: 'asc' },
    });
    expect(cursor4).toBeInstanceOf(Cursor);
    expect(cursor4.items).toMatchObject([
      { id: 4, name: 'User 4' },
      { id: 5, name: 'User 5' },
      { id: 6, name: 'User 6' },
    ]);
    expect(cursor4.totalCount).toBe(9);
    expect(cursor4.startCursor).toBe('WzRd');
    expect(cursor4.endCursor).toBe('WzZd');
    expect(cursor4.hasNextPage).toBe(true);
    expect(cursor4.hasPrevPage).toBe(true);
    queries = mock.mock.calls.map(call => call[0]).sort();
    expect(queries).toMatchSnapshot();
    orm.em.clear();
    mock.mockReset();

    // 5. page (last / forward)
    const cursor5 = await orm.em.findByCursor(User, {}, {
      first: 3,
      after: cursor4,
      orderBy: { id: 'asc' },
    });
    expect(cursor5).toBeInstanceOf(Cursor);
    expect(cursor5.items).toMatchObject([
      { id: 7, name: 'User 7' },
      { id: 8, name: 'User 8' },
      { id: 9, name: 'User 9' },
    ]);
    expect(cursor5.totalCount).toBe(9);
    expect(cursor5.startCursor).toBe('Wzdd');
    expect(cursor5.endCursor).toBe('Wzld');
    expect(cursor5.hasNextPage).toBe(false);
    expect(cursor5.hasPrevPage).toBe(true);
    queries = mock.mock.calls.map(call => call[0]).sort();
    expect(queries).toMatchSnapshot();
    orm.em.clear();
    mock.mockReset();
  });

  test('using `first` and `after` then backward using `last` and `before` (id desc)', async () => {
    const mock = mockLogger(orm, ['query', 'query-params']);

    // 1. page (first / forward)
    const cursor1 = await orm.em.findByCursor(User, {}, {
      first: 3,
      orderBy: { id: 'desc' },
    });
    expect(cursor1).toBeInstanceOf(Cursor);
    expect(cursor1.items).toMatchObject([
      { id: 9, name: 'User 9' },
      { id: 8, name: 'User 8' },
      { id: 7, name: 'User 7' },
    ]);
    expect(cursor1.totalCount).toBe(9);
    expect(cursor1.startCursor).toBe('Wzld');
    expect(cursor1.endCursor).toBe('Wzdd');
    expect(cursor1.hasNextPage).toBe(true);
    expect(cursor1.hasPrevPage).toBe(false);
    let queries = mock.mock.calls.map(call => call[0]).sort();
    expect(queries).toMatchSnapshot();
    orm.em.clear();
    mock.mockReset();

    // 2. page (mid / forward)
    const cursor2 = await orm.em.findByCursor(User, {}, {
      first: 3,
      after: cursor1,
      orderBy: { id: 'desc' },
    });
    expect(cursor2).toBeInstanceOf(Cursor);
    expect(cursor2.items).toMatchObject([
      { id: 6, name: 'User 6' },
      { id: 5, name: 'User 5' },
      { id: 4, name: 'User 4' },
    ]);
    expect(cursor2.totalCount).toBe(9);
    expect(cursor2.startCursor).toBe('WzZd');
    expect(cursor2.endCursor).toBe('WzRd');
    expect(cursor2.hasNextPage).toBe(true);
    expect(cursor2.hasPrevPage).toBe(true);
    queries = mock.mock.calls.map(call => call[0]).sort();
    expect(queries).toMatchSnapshot();
    orm.em.clear();
    mock.mockReset();

    // 3. page (last / forward)
    const cursor3 = await orm.em.findByCursor(User, {}, {
      first: 3,
      after: cursor2,
      orderBy: { id: 'desc' },
    });
    expect(cursor3).toBeInstanceOf(Cursor);
    expect(cursor3.items).toMatchObject([
      { id: 3, name: 'User 3' },
      { id: 2, name: 'User 2' },
      { id: 1, name: 'User 1' },
    ]);
    expect(cursor3.totalCount).toBe(9);
    expect(cursor3.startCursor).toBe('WzNd');
    expect(cursor3.endCursor).toBe('WzFd');
    expect(cursor3.hasNextPage).toBe(false);
    expect(cursor3.hasPrevPage).toBe(true);
    queries = mock.mock.calls.map(call => call[0]).sort();
    expect(queries).toMatchSnapshot();
    orm.em.clear();
    mock.mockReset();

    // 4. page (mid / backward)
    const cursor4 = await orm.em.findByCursor(User, {}, {
      last: 3,
      before: cursor3,
      orderBy: { id: 'desc' },
    });
    expect(cursor4).toBeInstanceOf(Cursor);
    expect(cursor4.items).toMatchObject([
      { id: 6, name: 'User 6' },
      { id: 5, name: 'User 5' },
      { id: 4, name: 'User 4' },
    ]);
    expect(cursor4.totalCount).toBe(9);
    expect(cursor4.startCursor).toBe('WzZd');
    expect(cursor4.endCursor).toBe('WzRd');
    expect(cursor4.hasNextPage).toBe(true);
    expect(cursor4.hasPrevPage).toBe(true);
    queries = mock.mock.calls.map(call => call[0]).sort();
    expect(queries).toMatchSnapshot();
    orm.em.clear();
    mock.mockReset();

    // 5. page (first / backward)
    const cursor5 = await orm.em.findByCursor(User, {}, {
      last: 3,
      before: cursor4,
      orderBy: { id: 'desc' },
    });
    expect(cursor5).toBeInstanceOf(Cursor);
    expect(cursor5.items).toMatchObject([
      { id: 9, name: 'User 9' },
      { id: 8, name: 'User 8' },
      { id: 7, name: 'User 7' },
    ]);
    expect(cursor5.totalCount).toBe(9);
    expect(cursor5.startCursor).toBe('Wzld');
    expect(cursor5.endCursor).toBe('Wzdd');
    expect(cursor5.hasNextPage).toBe(true);
    expect(cursor5.hasPrevPage).toBe(false);
    queries = mock.mock.calls.map(call => call[0]).sort();
    expect(queries).toMatchSnapshot();
    orm.em.clear();
    mock.mockReset();
  });

  test('using `last` and `before` then forward using `first` and `after` (id desc)', async () => {
    const mock = mockLogger(orm, ['query', 'query-params']);

    // 1. page (last / backward)
    const cursor1 = await orm.em.findByCursor(User, {}, {
      last: 3,
      orderBy: { id: 'desc' },
    });
    expect(cursor1).toBeInstanceOf(Cursor);
    expect(cursor1.items).toMatchObject([
      { id: 3, name: 'User 3' },
      { id: 2, name: 'User 2' },
      { id: 1, name: 'User 1' },
    ]);
    expect(cursor1.totalCount).toBe(9);
    expect(cursor1.startCursor).toBe('WzNd');
    expect(cursor1.endCursor).toBe('WzFd');
    expect(cursor1.hasNextPage).toBe(false);
    expect(cursor1.hasPrevPage).toBe(true);
    let queries = mock.mock.calls.map(call => call[0]).sort();
    expect(queries).toMatchSnapshot();
    orm.em.clear();
    mock.mockReset();

    // 2. page (mid / backward)
    const cursor2 = await orm.em.findByCursor(User, {}, {
      last: 3,
      before: cursor1,
      orderBy: { id: 'desc' },
    });
    expect(cursor2).toBeInstanceOf(Cursor);
    expect(cursor2.items).toMatchObject([
      { id: 6, name: 'User 6' },
      { id: 5, name: 'User 5' },
      { id: 4, name: 'User 4' },
    ]);
    expect(cursor2.totalCount).toBe(9);
    expect(cursor2.startCursor).toBe('WzZd');
    expect(cursor2.endCursor).toBe('WzRd');
    expect(cursor2.hasNextPage).toBe(true);
    expect(cursor2.hasPrevPage).toBe(true);
    queries = mock.mock.calls.map(call => call[0]).sort();
    expect(queries).toMatchSnapshot();
    orm.em.clear();
    mock.mockReset();

    // 3. page (first / backward)
    const cursor3 = await orm.em.findByCursor(User, {}, {
      last: 3,
      before: cursor2,
      orderBy: { id: 'desc' },
    });
    expect(cursor3).toBeInstanceOf(Cursor);
    expect(cursor3.items).toMatchObject([
      { id: 9, name: 'User 9' },
      { id: 8, name: 'User 8' },
      { id: 7, name: 'User 7' },
    ]);
    expect(cursor3.totalCount).toBe(9);
    expect(cursor3.startCursor).toBe('Wzld');
    expect(cursor3.endCursor).toBe('Wzdd');
    expect(cursor3.hasNextPage).toBe(true);
    expect(cursor3.hasPrevPage).toBe(false);
    queries = mock.mock.calls.map(call => call[0]).sort();
    expect(queries).toMatchSnapshot();
    orm.em.clear();
    mock.mockReset();

    // 4. page (mid / forward)
    const cursor4 = await orm.em.findByCursor(User, {}, {
      first: 3,
      after: cursor3,
      orderBy: { id: 'desc' },
    });
    expect(cursor4).toBeInstanceOf(Cursor);
    expect(cursor4.length).toBe(3);
    expect(cursor4.items).toMatchObject([
      { id: 6, name: 'User 6' },
      { id: 5, name: 'User 5' },
      { id: 4, name: 'User 4' },
    ]);
    expect(cursor4.totalCount).toBe(9);
    expect(cursor4.startCursor).toBe('WzZd');
    expect(cursor4.endCursor).toBe('WzRd');
    expect(cursor4.hasNextPage).toBe(true);
    expect(cursor4.hasPrevPage).toBe(true);
    queries = mock.mock.calls.map(call => call[0]).sort();
    expect(queries).toMatchSnapshot();
    orm.em.clear();
    mock.mockReset();

    // 5. page (last / forward)
    const cursor5 = await orm.em.findByCursor(User, {}, {
      first: 3,
      after: cursor4,
      orderBy: { id: 'desc' },
    });
    expect(cursor5).toBeInstanceOf(Cursor);
    expect(cursor5.items).toMatchObject([
      { id: 3, name: 'User 3' },
      { id: 2, name: 'User 2' },
      { id: 1, name: 'User 1' },
    ]);
    expect(cursor5.totalCount).toBe(9);
    expect(cursor5.startCursor).toBe('WzNd');
    expect(cursor5.endCursor).toBe('WzFd');
    expect(cursor5.hasNextPage).toBe(false);
    expect(cursor5.hasPrevPage).toBe(true);
    queries = mock.mock.calls.map(call => call[0]).sort();
    expect(queries).toMatchSnapshot();
    orm.em.clear();
    mock.mockReset();
  });
});
