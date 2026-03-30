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
