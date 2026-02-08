import { EntitySchema, MikroORM, FilterQuery } from '@mikro-orm/sqlite';

interface UserStatusAvailable {
  type: 'available';
  at: Date;
}

interface UserStatusUnavailable {
  type: 'unavailable';
  at: Date;
}

interface UserStatusUnknown {
  type: 'unknown';
  at?: Date;
}

type UserStatus = UserStatusAvailable | UserStatusUnavailable | UserStatusUnknown;

const UserStatusSchema = new EntitySchema<UserStatus>({
  name: 'UserStatus',
  embeddable: true,
  properties: {
    type: { name: 'type', type: 'string', enum: true, items: () => ['available', 'unavailable', 'unknown'] },
    at: { name: 'at', type: 'datetime', nullable: true },
  },
});

interface User {
  id: number;
  firstName: string;
  lastName: string;
  status: UserStatus;
}

const UserSchema = new EntitySchema<User>({
  name: 'User',
  tableName: 'users',
  properties: {
    id: { name: 'id', type: 'number', primary: true },
    firstName: { name: 'first_name', type: 'text' },
    lastName: { name: 'last_name', type: 'text' },
    status: { name: 'status', kind: 'embedded', entity: () => UserStatusSchema },
  },
});

describe('GH7111 - FilterQuery type safety for union types', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [UserStatusSchema, UserSchema],
      dbName: ':memory:',
    });
    await orm.schema.create();
  });

  afterAll(async () => {
    await orm.close();
  });

  test('issue #7111 repro: filter with $in on discriminator property', async () => {
    // This is the exact case from the issue that was failing
    // The type should now accept $in with multiple discriminator values
    const filter: FilterQuery<User> = {
      status: {
        type: { $in: ['available', 'unavailable'] },
      },
    };

    const users = await orm.em.find(UserSchema, filter);
    expect(users).toEqual([]);
  });

  // ============================================================================
  // Additional type-level tests
  // ============================================================================

  test('filter with $eq on discriminator property', async () => {
    const filter: FilterQuery<User> = {
      status: { type: 'available' },
    };

    const users = await orm.em.find(UserSchema, filter);
    expect(users).toEqual([]);
  });

  test('filter on shared property across all union members', async () => {
    const filter: FilterQuery<User> = {
      status: { at: { $gte: new Date() } },
    };

    const users = await orm.em.find(UserSchema, filter);
    expect(users).toEqual([]);
  });

  test('filter with $or on discriminator', async () => {
    const filter: FilterQuery<User> = {
      $or: [{ status: { type: 'available' } }, { status: { type: 'unknown' } }],
    };

    const users = await orm.em.find(UserSchema, filter);
    expect(users).toEqual([]);
  });

  test('filter combining discriminator and shared property', async () => {
    const filter: FilterQuery<User> = {
      status: {
        type: 'available',
        at: { $gte: new Date() },
      },
    };

    const users = await orm.em.find(UserSchema, filter);
    expect(users).toEqual([]);
  });

  test('runtime query with union embeddable works correctly', async () => {
    // Create test data
    const user1 = orm.em.create(UserSchema, {
      firstName: 'Available',
      lastName: 'User',
      status: { type: 'available', at: new Date('2024-01-01') },
    });
    const user2 = orm.em.create(UserSchema, {
      firstName: 'Unavailable',
      lastName: 'User',
      status: { type: 'unavailable', at: new Date('2024-01-02') },
    });
    const user3 = orm.em.create(UserSchema, {
      firstName: 'Unknown',
      lastName: 'User',
      status: { type: 'unknown' },
    });

    await orm.em.persist([user1, user2, user3]).flush();
    orm.em.clear();

    // Query using $in on discriminator - the exact case from the issue
    const availableOrUnavailable = await orm.em.find(
      UserSchema,
      {
        status: { type: { $in: ['available', 'unavailable'] } },
      },
      { orderBy: { firstName: 'asc' } },
    );

    expect(availableOrUnavailable).toHaveLength(2);
    expect(availableOrUnavailable[0].firstName).toBe('Available');
    expect(availableOrUnavailable[1].firstName).toBe('Unavailable');

    // Query single type
    const unknownOnly = await orm.em.find(UserSchema, {
      status: { type: 'unknown' },
    });

    expect(unknownOnly).toHaveLength(1);
    expect(unknownOnly[0].firstName).toBe('Unknown');
  });
});
