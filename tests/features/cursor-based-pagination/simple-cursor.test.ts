import { Cursor, Entity, MikroORM, Options, PrimaryKey, Property, SimpleLogger } from '@mikro-orm/core';
import { mockLogger } from '../../helpers';
import { PLATFORMS } from '../../bootstrap';

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
      dbName: type.includes('sqlite') ? ':memory:' : 'mikro_orm_cursor_simple',
      driver: PLATFORMS[type],
      loggerFactory: SimpleLogger.create,
      ...options,
    });
    await orm.schema.refreshDatabase();

    for (let i = 0; i < 50; i++) {
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

  test('using `first` and `after` (id asc)', async () => {
    const mock = mockLogger(orm, ['query', 'query-params']);

    // empty page
    const cursor0 = await orm.em.findByCursor(User, {}, {
      first: 0,
      orderBy: { id: 'asc' },
    });
    expect(cursor0).toBeInstanceOf(Cursor);
    expect(cursor0.length).toBe(0);

    // 1. page
    const cursor1 = await orm.em.findByCursor(User, {}, {
      first: 3,
      orderBy: { id: 'asc' },
    });
    expect(cursor1).toBeInstanceOf(Cursor);
    expect(cursor1.length).toBe(3);
    expect(cursor1.items).toMatchObject([
      { id: 1, name: 'User 1' },
      { id: 2, name: 'User 2' },
      { id: 3, name: 'User 3' },
    ]);
    expect(cursor1.totalCount).toBe(50);
    expect(cursor1.startCursor).toBe('WzFd');
    expect(cursor1.endCursor).toBe('WzNd');
    expect(cursor1.hasNextPage).toBe(true);
    expect(cursor1.hasPrevPage).toBe(false);
    let queries = mock.mock.calls.map(call => call[0]).sort();
    expect(queries).toMatchSnapshot();
    orm.em.clear();
    mock.mockReset();

    // 2. page
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
    expect(cursor2.totalCount).toBe(50);
    expect(cursor2.startCursor).toBe('WzRd');
    expect(cursor2.endCursor).toBe('WzZd');
    expect(cursor2.hasNextPage).toBe(true);
    expect(cursor2.hasPrevPage).toBe(true);
    queries = mock.mock.calls.map(call => call[0]).sort();
    expect(queries).toMatchSnapshot();
    orm.em.clear();
    mock.mockReset();

    // 3. page
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
    expect(cursor3.totalCount).toBe(50);
    expect(cursor3.startCursor).toBe('Wzdd');
    expect(cursor3.endCursor).toBe('Wzld');
    expect(cursor3.hasNextPage).toBe(true);
    expect(cursor3.hasPrevPage).toBe(true);
    queries = mock.mock.calls.map(call => call[0]).sort();
    expect(queries).toMatchSnapshot();
    orm.em.clear();
    mock.mockReset();

    // 4. page
    const cursor4 = await orm.em.findByCursor(User, {}, {
      first: 40,
      after: cursor3,
      orderBy: { id: 'asc' },
    });
    expect(cursor4).toBeInstanceOf(Cursor);
    expect(cursor4.items).toHaveLength(40);
    expect(cursor4.items[0]).toMatchObject({ id: 10, name: 'User 10' });
    expect(cursor4.items[39]).toMatchObject({ id: 49, name: 'User 49' });
    expect(cursor4.totalCount).toBe(50);
    expect(cursor4.startCursor).toBe('WzEwXQ');
    expect(cursor4.endCursor).toBe('WzQ5XQ');
    expect(cursor4.hasNextPage).toBe(true);
    expect(cursor4.hasPrevPage).toBe(true);
    queries = mock.mock.calls.map(call => call[0]).sort();
    expect(queries).toMatchSnapshot();
    orm.em.clear();
    mock.mockReset();

    // 5. page (last)
    const cursor5 = await orm.em.findByCursor(User, {}, {
      first: 40,
      after: cursor4,
      orderBy: { id: 'asc' },
    });
    expect(cursor5).toBeInstanceOf(Cursor);
    expect(cursor5.items).toMatchObject([{ id: 50, name: 'User 50' }]);
    expect(cursor5.totalCount).toBe(50);
    expect(cursor5.startCursor).toBe('WzUwXQ');
    expect(cursor5.endCursor).toBe('WzUwXQ');
    expect(cursor5.hasNextPage).toBe(false);
    expect(cursor5.hasPrevPage).toBe(true);
    queries = mock.mock.calls.map(call => call[0]).sort();
    expect(queries).toMatchSnapshot();
    orm.em.clear();
    mock.mockReset();

    // 6. page (empty)
    const cursor6 = await orm.em.findByCursor(User, {}, {
      first: 1,
      after: cursor5,
      orderBy: { id: 'asc' },
    });
    expect(cursor6).toBeInstanceOf(Cursor);
    expect(cursor6.items).toHaveLength(0);
    expect(cursor6.totalCount).toBe(50);
    expect(cursor6.startCursor).toBeNull();
    expect(cursor6.endCursor).toBeNull();
    expect(cursor6.hasNextPage).toBe(false);
    expect(cursor6.hasPrevPage).toBe(true);
    queries = mock.mock.calls.map(call => call[0]).sort();
    expect(queries).toMatchSnapshot();
    orm.em.clear();
    mock.mockReset();
  });

  test('using `first` and `after` (id desc)', async () => {
    const mock = mockLogger(orm, ['query', 'query-params']);

    // 1. page
    const cursor1 = await orm.em.findByCursor(User, {}, {
      first: 3,
      orderBy: { id: 'desc' },
    });
    expect(cursor1).toBeInstanceOf(Cursor);
    expect(cursor1.items).toMatchObject([
      { id: 50, name: 'User 50' },
      { id: 49, name: 'User 49' },
      { id: 48, name: 'User 48' },
    ]);
    expect(cursor1.totalCount).toBe(50);
    expect(cursor1.startCursor).toBe('WzUwXQ');
    expect(cursor1.endCursor).toBe('WzQ4XQ');
    expect(cursor1.hasNextPage).toBe(true);
    expect(cursor1.hasPrevPage).toBe(false);
    let queries = mock.mock.calls.map(call => call[0]).sort();
    expect(queries).toMatchSnapshot();
    orm.em.clear();
    mock.mockReset();

    // 2. page
    const cursor2 = await orm.em.findByCursor(User, {}, {
      first: 3,
      after: cursor1,
      orderBy: { id: 'desc' },
    });
    expect(cursor2).toBeInstanceOf(Cursor);
    expect(cursor2.items).toMatchObject([
      { id: 47, name: 'User 47' },
      { id: 46, name: 'User 46' },
      { id: 45, name: 'User 45' },
    ]);
    expect(cursor2.totalCount).toBe(50);
    expect(cursor2.startCursor).toBe('WzQ3XQ');
    expect(cursor2.endCursor).toBe('WzQ1XQ');
    expect(cursor2.hasNextPage).toBe(true);
    expect(cursor2.hasPrevPage).toBe(true);
    queries = mock.mock.calls.map(call => call[0]).sort();
    expect(queries).toMatchSnapshot();
    orm.em.clear();
    mock.mockReset();

    // 3. page
    const cursor3 = await orm.em.findByCursor(User, {}, {
      first: 3,
      after: cursor2,
      orderBy: { id: 'desc' },
    });
    expect(cursor3).toBeInstanceOf(Cursor);
    expect(cursor3.items).toMatchObject([
      { id: 44, name: 'User 44' },
      { id: 43, name: 'User 43' },
      { id: 42, name: 'User 42' },
    ]);
    expect(cursor3.totalCount).toBe(50);
    expect(cursor3.startCursor).toBe('WzQ0XQ');
    expect(cursor3.endCursor).toBe('WzQyXQ');
    expect(cursor3.hasNextPage).toBe(true);
    expect(cursor3.hasPrevPage).toBe(true);
    queries = mock.mock.calls.map(call => call[0]).sort();
    expect(queries).toMatchSnapshot();
    orm.em.clear();
    mock.mockReset();

    // 4. page
    const cursor4 = await orm.em.findByCursor(User, {}, {
      first: 40,
      after: cursor3,
      orderBy: { id: 'desc' },
    });
    expect(cursor4).toBeInstanceOf(Cursor);
    expect(cursor4.items).toHaveLength(40);
    expect(cursor4.items[0]).toMatchObject({ id: 41, name: 'User 41' });
    expect(cursor4.items[39]).toMatchObject({ id: 2, name: 'User 2' });
    expect(cursor4.totalCount).toBe(50);
    expect(cursor4.startCursor).toBe('WzQxXQ');
    expect(cursor4.endCursor).toBe('WzJd');
    expect(cursor4.hasNextPage).toBe(true);
    expect(cursor4.hasPrevPage).toBe(true);
    queries = mock.mock.calls.map(call => call[0]).sort();
    expect(queries).toMatchSnapshot();
    orm.em.clear();
    mock.mockReset();

    // 5. page (last)
    const cursor5 = await orm.em.findByCursor(User, {}, {
      first: 40,
      after: cursor4,
      orderBy: { id: 'desc' },
    });
    expect(cursor5).toBeInstanceOf(Cursor);
    expect(cursor5.items).toMatchObject([{ id: 1, name: 'User 1' }]);
    expect(cursor5.totalCount).toBe(50);
    expect(cursor5.startCursor).toBe('WzFd');
    expect(cursor5.endCursor).toBe('WzFd');
    expect(cursor5.hasNextPage).toBe(false);
    expect(cursor5.hasPrevPage).toBe(true);
    queries = mock.mock.calls.map(call => call[0]).sort();
    expect(queries).toMatchSnapshot();
    orm.em.clear();
    mock.mockReset();

    // 6. page (empty)
    const cursor6 = await orm.em.findByCursor(User, {}, {
      first: 1,
      after: cursor5,
      orderBy: { id: 'desc' },
    });
    expect(cursor6).toBeInstanceOf(Cursor);
    expect(cursor6.items).toHaveLength(0);
    expect(cursor6.totalCount).toBe(50);
    expect(cursor6.startCursor).toBeNull();
    expect(cursor6.endCursor).toBeNull();
    expect(cursor6.hasNextPage).toBe(false);
    expect(cursor6.hasPrevPage).toBe(true);
    queries = mock.mock.calls.map(call => call[0]).sort();
    expect(queries).toMatchSnapshot();
    orm.em.clear();
    mock.mockReset();
  });

  test('using `last` and `before` (id asc)', async () => {
    const mock = mockLogger(orm, ['query', 'query-params']);

    // 1. page
    const cursor1 = await orm.em.findByCursor(User, {}, {
      last: 3,
      orderBy: { id: 'asc' },
    });
    expect(cursor1).toBeInstanceOf(Cursor);
    expect(cursor1.items).toMatchObject([
      { id: 48, name: 'User 48' },
      { id: 49, name: 'User 49' },
      { id: 50, name: 'User 50' },
    ]);
    expect(cursor1.totalCount).toBe(50);
    expect(cursor1.startCursor).toBe('WzQ4XQ');
    expect(cursor1.endCursor).toBe('WzUwXQ');
    expect(cursor1.hasNextPage).toBe(false);
    expect(cursor1.hasPrevPage).toBe(true);
    let queries = mock.mock.calls.map(call => call[0]).sort();
    expect(queries).toMatchSnapshot();
    orm.em.clear();
    mock.mockReset();

    // 2. page
    const cursor2 = await orm.em.findByCursor(User, {}, {
      last: 3,
      before: cursor1,
      orderBy: { id: 'asc' },
    });
    expect(cursor2).toBeInstanceOf(Cursor);
    expect(cursor2.items).toMatchObject([
      { id: 45, name: 'User 45' },
      { id: 46, name: 'User 46' },
      { id: 47, name: 'User 47' },
    ]);
    expect(cursor2.totalCount).toBe(50);
    expect(cursor2.startCursor).toBe('WzQ1XQ');
    expect(cursor2.endCursor).toBe('WzQ3XQ');
    expect(cursor2.hasNextPage).toBe(true);
    expect(cursor2.hasPrevPage).toBe(true);
    queries = mock.mock.calls.map(call => call[0]).sort();
    expect(queries).toMatchSnapshot();
    orm.em.clear();
    mock.mockReset();

    // 3. page
    const cursor3 = await orm.em.findByCursor(User, {}, {
      last: 3,
      before: cursor2,
      orderBy: { id: 'asc' },
    });
    expect(cursor3).toBeInstanceOf(Cursor);
    expect(cursor3.items).toMatchObject([
      { id: 42, name: 'User 42' },
      { id: 43, name: 'User 43' },
      { id: 44, name: 'User 44' },
    ]);
    expect(cursor3.totalCount).toBe(50);
    expect(cursor3.startCursor).toBe('WzQyXQ');
    expect(cursor3.endCursor).toBe('WzQ0XQ');
    expect(cursor3.hasNextPage).toBe(true);
    expect(cursor3.hasPrevPage).toBe(true);
    queries = mock.mock.calls.map(call => call[0]).sort();
    expect(queries).toMatchSnapshot();
    orm.em.clear();
    mock.mockReset();

    // 4. page
    const cursor4 = await orm.em.findByCursor(User, {}, {
      last: 40,
      before: cursor3,
      orderBy: { id: 'asc' },
    });
    expect(cursor4).toBeInstanceOf(Cursor);
    expect(cursor4.items).toHaveLength(40);
    expect(cursor4.items[0]).toMatchObject({ id: 2, name: 'User 2' });
    expect(cursor4.items[39]).toMatchObject({ id: 41, name: 'User 41' });
    expect(cursor4.totalCount).toBe(50);
    expect(cursor4.startCursor).toBe('WzJd');
    expect(cursor4.endCursor).toBe('WzQxXQ');
    expect(cursor4.hasNextPage).toBe(true);
    expect(cursor4.hasPrevPage).toBe(true);
    queries = mock.mock.calls.map(call => call[0]).sort();
    expect(queries).toMatchSnapshot();
    orm.em.clear();
    mock.mockReset();

    // 5. page (last)
    const cursor5 = await orm.em.findByCursor(User, {}, {
      last: 40,
      before: cursor4,
      orderBy: { id: 'asc' },
    });
    expect(cursor5).toBeInstanceOf(Cursor);
    expect(cursor5.items).toMatchObject([{ id: 1, name: 'User 1' }]);
    expect(cursor5.totalCount).toBe(50);
    expect(cursor5.startCursor).toBe('WzFd');
    expect(cursor5.endCursor).toBe('WzFd');
    expect(cursor5.hasNextPage).toBe(true);
    expect(cursor5.hasPrevPage).toBe(false);
    queries = mock.mock.calls.map(call => call[0]).sort();
    expect(queries).toMatchSnapshot();
    orm.em.clear();
    mock.mockReset();

    // 6. page (empty)
    const cursor6 = await orm.em.findByCursor(User, {}, {
      last: 1,
      before: cursor5,
      orderBy: { id: 'asc' },
    });
    expect(cursor6).toBeInstanceOf(Cursor);
    expect(cursor6.items).toHaveLength(0);
    expect(cursor6.totalCount).toBe(50);
    expect(cursor6.startCursor).toBeNull();
    expect(cursor6.endCursor).toBeNull();
    expect(cursor6.hasNextPage).toBe(true);
    expect(cursor6.hasPrevPage).toBe(false);
    queries = mock.mock.calls.map(call => call[0]).sort();
    expect(queries).toMatchSnapshot();
    orm.em.clear();
    mock.mockReset();
  });

  test('using `last` and `before` (id desc)', async () => {
    const mock = mockLogger(orm, ['query', 'query-params']);

    // 1. page
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
    expect(cursor1.totalCount).toBe(50);
    expect(cursor1.startCursor).toBe('WzNd');
    expect(cursor1.endCursor).toBe('WzFd');
    expect(cursor1.hasNextPage).toBe(false);
    expect(cursor1.hasPrevPage).toBe(true);
    let queries = mock.mock.calls.map(call => call[0]).sort();
    expect(queries).toMatchSnapshot();
    orm.em.clear();
    mock.mockReset();

    // 2. page
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
    expect(cursor2.totalCount).toBe(50);
    expect(cursor2.startCursor).toBe('WzZd');
    expect(cursor2.endCursor).toBe('WzRd');
    expect(cursor2.hasNextPage).toBe(true);
    expect(cursor2.hasPrevPage).toBe(true);
    queries = mock.mock.calls.map(call => call[0]).sort();
    expect(queries).toMatchSnapshot();
    orm.em.clear();
    mock.mockReset();

    // 3. page
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
    expect(cursor3.totalCount).toBe(50);
    expect(cursor3.startCursor).toBe('Wzld');
    expect(cursor3.endCursor).toBe('Wzdd');
    expect(cursor3.hasNextPage).toBe(true);
    expect(cursor3.hasPrevPage).toBe(true);
    queries = mock.mock.calls.map(call => call[0]).sort();
    expect(queries).toMatchSnapshot();
    orm.em.clear();
    mock.mockReset();

    // 4. page
    const cursor4 = await orm.em.findByCursor(User, {}, {
      last: 40,
      before: cursor3,
      orderBy: { id: 'desc' },
    });
    expect(cursor4).toBeInstanceOf(Cursor);
    expect(cursor4.items).toHaveLength(40);
    expect(cursor4.items[0]).toMatchObject({ id: 49, name: 'User 49' });
    expect(cursor4.items[39]).toMatchObject({ id: 10, name: 'User 10' });
    expect(cursor4.totalCount).toBe(50);
    expect(cursor4.startCursor).toBe('WzQ5XQ');
    expect(cursor4.endCursor).toBe('WzEwXQ');
    expect(cursor4.hasNextPage).toBe(true);
    expect(cursor4.hasPrevPage).toBe(true);
    queries = mock.mock.calls.map(call => call[0]).sort();
    expect(queries).toMatchSnapshot();
    orm.em.clear();
    mock.mockReset();

    // 5. page (last)
    const cursor5 = await orm.em.findByCursor(User, {}, {
      last: 40,
      before: cursor4,
      orderBy: { id: 'desc' },
    });
    expect(cursor5).toBeInstanceOf(Cursor);
    expect(cursor5.items).toMatchObject([{ id: 50, name: 'User 50' }]);
    expect(cursor5.totalCount).toBe(50);
    expect(cursor5.startCursor).toBe('WzUwXQ');
    expect(cursor5.endCursor).toBe('WzUwXQ');
    expect(cursor5.hasNextPage).toBe(true);
    expect(cursor5.hasPrevPage).toBe(false);
    queries = mock.mock.calls.map(call => call[0]).sort();
    expect(queries).toMatchSnapshot();
    orm.em.clear();
    mock.mockReset();

    // 6. page (empty)
    const cursor6 = await orm.em.findByCursor(User, {}, {
      last: 1,
      before: cursor5,
      orderBy: { id: 'desc' },
    });
    expect(cursor6).toBeInstanceOf(Cursor);
    expect(cursor6.items).toHaveLength(0);
    expect(cursor6.totalCount).toBe(50);
    expect(cursor6.startCursor).toBeNull();
    expect(cursor6.endCursor).toBeNull();
    expect(cursor6.hasNextPage).toBe(true);
    expect(cursor6.hasPrevPage).toBe(false);
    queries = mock.mock.calls.map(call => call[0]).sort();
    expect(queries).toMatchSnapshot();
    orm.em.clear();
    mock.mockReset();
  });

  test('using both `before` and `after` (id desc)', async () => {
    const cursor1 = await orm.em.findByCursor(User, {}, {
      before: { id: 5 },
      after: { id: 15 },
      orderBy: { id: 'desc' },
    });
    expect([...cursor1]).toMatchObject([
      { id: 14, name: 'User 14' },
      { id: 13, name: 'User 13' },
      { id: 12, name: 'User 12' },
      { id: 11, name: 'User 11' },
      { id: 10, name: 'User 10' },
      { id: 9, name: 'User 9' },
      { id: 8, name: 'User 8' },
      { id: 7, name: 'User 7' },
      { id: 6, name: 'User 6' },
    ]);

    const cursor2 = await orm.em.findByCursor(User, {}, {
      before: { id: 5 },
      after: { id: 15 },
      first: 5,
      orderBy: { id: 'desc' },
    });
    expect([...cursor2]).toMatchObject([
      { id: 14, name: 'User 14' },
      { id: 13, name: 'User 13' },
      { id: 12, name: 'User 12' },
      { id: 11, name: 'User 11' },
      { id: 10, name: 'User 10' },
    ]);

    const cursor3 = await orm.em.findByCursor(User, {}, {
      before: { id: 5 },
      after: { id: 15 },
      last: 5,
      orderBy: { id: 'desc' },
    });
    expect([...cursor3]).toMatchObject([
      { id: 10, name: 'User 10' },
      { id: 9, name: 'User 9' },
      { id: 8, name: 'User 8' },
      { id: 7, name: 'User 7' },
      { id: 6, name: 'User 6' },
    ]);
  });

  test('using both `before` and `after` with `em.find` (id desc)', async () => {
    const items1 = await orm.em.find(User, {}, {
      before: { id: 5 },
      after: { id: 15 },
      orderBy: { id: 'desc' },
    });
    expect(items1).toMatchObject([
      { id: 14, name: 'User 14' },
      { id: 13, name: 'User 13' },
      { id: 12, name: 'User 12' },
      { id: 11, name: 'User 11' },
      { id: 10, name: 'User 10' },
      { id: 9, name: 'User 9' },
      { id: 8, name: 'User 8' },
      { id: 7, name: 'User 7' },
      { id: 6, name: 'User 6' },
    ]);

    const items2 = await orm.em.find(User, {}, {
      before: { id: 5 },
      after: { id: 15 },
      first: 5,
      orderBy: { id: 'desc' },
    });
    expect(items2).toMatchObject([
      { id: 14, name: 'User 14' },
      { id: 13, name: 'User 13' },
      { id: 12, name: 'User 12' },
      { id: 11, name: 'User 11' },
      { id: 10, name: 'User 10' },
    ]);

    const items3 = await orm.em.find(User, {}, {
      before: { id: 5 },
      after: { id: 15 },
      last: 5,
      orderBy: { id: 'desc' },
    });
    expect(items3).toMatchObject([
      { id: 10, name: 'User 10' },
      { id: 9, name: 'User 9' },
      { id: 8, name: 'User 8' },
      { id: 7, name: 'User 7' },
      { id: 6, name: 'User 6' },
    ]);
  });

  test('exclude count when `includeCount` is set to false', async () => {
    const mock = mockLogger(orm, ['query', 'query-params']);
    const cursor1 = await orm.em.findByCursor(User, {}, {
      first: 3,
      orderBy: { id: 'asc' },
      includeCount: false,
    });
    expect(cursor1).toBeInstanceOf(Cursor);
    expect(cursor1.items).toMatchObject([
      { id: 1, name: 'User 1' },
      { id: 2, name: 'User 2' },
      { id: 3, name: 'User 3' },
    ]);
    expect(cursor1.totalCount).toBeUndefined();
    expect(cursor1.startCursor).toBe('WzFd');
    expect(cursor1.endCursor).toBe('WzNd');
    expect(cursor1.hasNextPage).toBe(true);
    expect(cursor1.hasPrevPage).toBe(false);
    const queries = mock.mock.calls.map(call => call[0]).sort();
    expect(queries).toMatchSnapshot();
  });

  test('validation', async () => {
    await expect(orm.em.findByCursor(User, {}, {
      before: { id: 5 },
      after: { id: 15 },
    })).rejects.toThrow('Explicit `orderBy` option required');
  });
});
