import { v4 } from 'uuid';
import { MikroORM, SimpleLogger } from '@mikro-orm/sqlite';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { mockLogger } from '../../helpers.js';

@Entity()
class User {
  @PrimaryKey()
  id: string = v4();

  @Property()
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  @Property({ unique: true })
  email!: string;

  @Property()
  name: string = '';
}

@Entity()
class User2 {
  @PrimaryKey({ onCreate: () => v4() })
  id!: string;

  @Property({ onCreate: () => new Date() })
  createdAt!: Date;

  @Property({ onCreate: () => new Date(), onUpdate: () => new Date() })
  updatedAt!: Date;

  @Property({ unique: true })
  email!: string;

  @Property()
  name: string = '';
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [User, User2],
    metadataProvider: ReflectMetadataProvider,
    dbName: ':memory:',
    loggerFactory: SimpleLogger.create,
  });
  await orm.schema.refresh();
});

afterAll(async () => {
  await orm.close(true);
});

beforeEach(() => orm.em.clear());

test('GH #7399 - upsert with entity instance having constructor defaults', async () => {
  const mock = mockLogger(orm);

  const user = new User();
  user.email = 'foo@bar.com';
  user.name = 'test';
  await orm.em.upsert(user);

  expect(user.id).toBeDefined();
  expect(user.createdAt).toBeInstanceOf(Date);
  expect(user.updatedAt).toBeInstanceOf(Date);

  // The insert query should include id, created_at, updated_at
  const insertQuery = mock.mock.calls.find(c => c[0].includes('insert'));
  expect(insertQuery).toBeDefined();
  expect(insertQuery![0]).toContain('`id`');
  expect(insertQuery![0]).toContain('`created_at`');
  expect(insertQuery![0]).toContain('`updated_at`');
});

test('GH #7399 - upsert with entity instance having onCreate hooks', async () => {
  const mock = mockLogger(orm);

  const user = new User2();
  user.email = 'bar@bar.com';
  user.name = 'test';
  // id, createdAt, updatedAt rely on onCreate hooks
  await orm.em.upsert(user);

  expect(user.id).toBeDefined();
  expect(user.createdAt).toBeInstanceOf(Date);
  expect(user.updatedAt).toBeInstanceOf(Date);

  // The insert query should include id, created_at, updated_at
  const insertQuery = mock.mock.calls.find(c => c[0].includes('insert'));
  expect(insertQuery).toBeDefined();
  expect(insertQuery![0]).toContain('`id`');
  expect(insertQuery![0]).toContain('`created_at`');
  expect(insertQuery![0]).toContain('`updated_at`');
});

test('GH #7399 - upsertMany with entity instances having onCreate hooks', async () => {
  const user1 = new User2();
  user1.email = 'many1@bar.com';
  user1.name = 'test1';

  const user2 = new User2();
  user2.email = 'many2@bar.com';
  user2.name = 'test2';

  await orm.em.upsertMany(User2, [user1, user2]);

  expect(user1.id).toBeDefined();
  expect(user1.createdAt).toBeInstanceOf(Date);
  expect(user2.id).toBeDefined();
  expect(user2.createdAt).toBeInstanceOf(Date);
});

test('GH #7399 - upsert with plain data applies onCreate hooks', async () => {
  const mock = mockLogger(orm);

  const user = await orm.em.upsert(User2, {
    email: 'pojo@bar.com',
    name: 'test',
  } as any);

  expect(user.id).toBeDefined();
  expect(user.createdAt).toBeInstanceOf(Date);
  expect(user.updatedAt).toBeInstanceOf(Date);

  const insertQuery = mock.mock.calls.find(c => c[0].includes('insert'));
  expect(insertQuery).toBeDefined();
  expect(insertQuery![0]).toContain('`id`');
  expect(insertQuery![0]).toContain('`created_at`');
  expect(insertQuery![0]).toContain('`updated_at`');
  // should NOT include `name` default (empty string) since it was explicitly provided
  // only onCreate hooks should fire, not prop.default
});

test('GH #7399 - upsertMany with plain data applies onCreate hooks', async () => {
  const [user1, user2] = await orm.em.upsertMany(User2, [
    { email: 'pojo-many1@bar.com', name: 'test1' } as any,
    { email: 'pojo-many2@bar.com', name: 'test2' } as any,
  ]);

  expect(user1.id).toBeDefined();
  expect(user1.createdAt).toBeInstanceOf(Date);
  expect(user2.id).toBeDefined();
  expect(user2.createdAt).toBeInstanceOf(Date);
});

test('GH #7399 - upsert of existing row does not overwrite onCreate values (plain data)', async () => {
  const first = await orm.em.upsert(User2, { email: 'existing@bar.com', name: 'a' } as any);
  const originalId = first.id;
  const originalCreatedAt = first.createdAt;
  orm.em.clear();

  const mock = mockLogger(orm);
  const second = await orm.em.upsert(User2, { email: 'existing@bar.com', name: 'b' } as any);

  // generated values must not leak into the `on conflict do update set` clause
  const upsertQuery = mock.mock.calls.find(c => c[0].includes('on conflict'))![0];
  expect(upsertQuery).not.toContain('`id` = excluded.`id`');
  expect(upsertQuery).not.toContain('`created_at` = excluded.`created_at`');
  expect(upsertQuery).toContain('`name` = excluded.`name`');

  expect(second.id).toBe(originalId);
  expect(+second.createdAt).toBe(+originalCreatedAt);
  expect(second.name).toBe('b');

  const rows = await orm.em.getConnection().execute('select * from user2 where email = ?', ['existing@bar.com']);
  expect(rows).toHaveLength(1);
  expect(rows[0].id).toBe(originalId);
  expect(rows[0].created_at).toBe(+originalCreatedAt);
});

test('GH #7399 - upsert of existing row does not overwrite onCreate values (entity instance)', async () => {
  await orm.em.upsert(User2, { email: 'existing2@bar.com', name: 'a' } as any);
  const original = await orm.em.fork().findOneOrFail(User2, { email: 'existing2@bar.com' });
  orm.em.clear();

  const user = new User2();
  user.email = 'existing2@bar.com';
  user.name = 'b';
  const second = await orm.em.upsert(user);

  expect(second.id).toBe(original.id);
  expect(+second.createdAt).toBe(+original.createdAt);
  expect(second.name).toBe('b');
});

test('GH #7399 - upsertMany of existing rows does not overwrite onCreate values', async () => {
  const [first1, first2] = await orm.em.upsertMany(User2, [
    { email: 'existing-many1@bar.com', name: 'a1' } as any,
    { email: 'existing-many2@bar.com', name: 'a2' } as any,
  ]);
  const originalIds = [first1.id, first2.id];
  const originalCreatedAts = [+first1.createdAt, +first2.createdAt];
  orm.em.clear();

  const [second1, second2] = await orm.em.upsertMany(User2, [
    { email: 'existing-many1@bar.com', name: 'b1' } as any,
    { email: 'existing-many2@bar.com', name: 'b2' } as any,
  ]);

  expect(second1.id).toBe(originalIds[0]);
  expect(+second1.createdAt).toBe(originalCreatedAts[0]);
  expect(second1.name).toBe('b1');
  expect(second2.id).toBe(originalIds[1]);
  expect(+second2.createdAt).toBe(originalCreatedAts[1]);
  expect(second2.name).toBe('b2');
});

test('GH #7399 - explicitly provided values still update existing rows', async () => {
  await orm.em.upsert(User2, { email: 'explicit@bar.com', name: 'a' } as any);
  orm.em.clear();

  // when the value is provided by the user, it is not `onCreate` generated and should be merged
  const explicitDate = new Date(12345);
  const second = await orm.em.upsert(User2, {
    email: 'explicit@bar.com',
    name: 'b',
    createdAt: explicitDate,
  } as any);

  expect(+second.createdAt).toBe(+explicitDate);
});
