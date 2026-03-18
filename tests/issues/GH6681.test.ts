import { Collection, LoadStrategy, MikroORM } from '@mikro-orm/sqlite';
import {
  Entity,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryKey,
  Property,
  ReflectMetadataProvider,
} from '@mikro-orm/decorators/legacy';
import { mockLogger } from '../helpers.js';

@Entity()
class Tag {
  @PrimaryKey()
  id!: number;

  @Property()
  name: string;

  constructor(name: string) {
    this.name = name;
  }
}

@Entity()
class User {
  @PrimaryKey()
  id!: number;

  @Property()
  name: string;

  @ManyToMany(() => Tag)
  tags = new Collection<Tag>(this);

  @OneToMany(() => Comment, comment => comment.user)
  comments = new Collection<Comment>(this);

  constructor(name: string) {
    this.name = name;
  }
}

@Entity()
class Comment {
  @PrimaryKey()
  id!: number;

  @Property()
  text: string;

  @ManyToOne(() => User)
  user!: User;

  constructor(text: string) {
    this.text = text;
  }
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: ':memory:',
    entities: [User, Tag, Comment],
  });
  await orm.schema.refresh();

  const tag1 = orm.em.create(Tag, { name: 'tag1' });
  const tag2 = orm.em.create(Tag, { name: 'tag2' });
  const user1 = orm.em.create(User, { name: 'User1' });
  user1.tags.add(tag1, tag2);
  const user2 = orm.em.create(User, { name: 'User2' });
  user2.tags.add(tag1);
  orm.em.create(Comment, { text: 'comment1', user: user1 });
  orm.em.create(Comment, { text: 'comment2', user: user1 });
  orm.em.create(Comment, { text: 'comment3', user: user2 });
  await orm.em.flush();
  orm.em.clear();
});

afterAll(async () => {
  await orm.close(true);
});

test('GH6681 - findAndCount with M:N filter and limit should not have redundant joins in outer query', async () => {
  const mock = mockLogger(orm);

  const [users, count] = await orm.em.fork().findAndCount(User, { tags: { name: 'tag1' } }, { limit: 1 });

  expect(count).toBe(2);
  expect(users).toHaveLength(1);

  // The outer query should not have redundant joins on the M:N pivot table and related entity
  const dataQuery = mock.mock.calls.find(
    call => call[0]?.includes('select') && call[0]?.includes('in (select'),
  )?.[0] as string;
  expect(dataQuery).toBeDefined();
  // The outer query should only join the root table, not the pivot and tag tables
  const outerQuery = dataQuery.split('where')[0];
  expect(outerQuery).not.toContain('join');
});

test('GH6681 - find with M:N filter and limit should not have redundant joins', async () => {
  const mock = mockLogger(orm);

  const users = await orm.em.fork().find(User, { tags: { name: 'tag1' } }, { limit: 1 });

  expect(users).toHaveLength(1);

  const dataQuery = mock.mock.calls.find(
    call => call[0]?.includes('select') && call[0]?.includes('in (select'),
  )?.[0] as string;
  expect(dataQuery).toBeDefined();
  const outerQuery = dataQuery.split('where')[0];
  expect(outerQuery).not.toContain('join');
});

test('GH6681 - results are still correct with the optimization', async () => {
  // With limit
  const [users1, count1] = await orm.em
    .fork()
    .findAndCount(User, { tags: { name: 'tag1' } }, { limit: 1, orderBy: { id: 'asc' } });
  expect(count1).toBe(2);
  expect(users1).toHaveLength(1);
  expect(users1[0].name).toBe('User1');

  // With limit and offset
  const [users2, count2] = await orm.em
    .fork()
    .findAndCount(User, { tags: { name: 'tag1' } }, { limit: 1, offset: 1, orderBy: { id: 'asc' } });
  expect(count2).toBe(2);
  expect(users2).toHaveLength(1);
  expect(users2[0].name).toBe('User2');

  // Without limit - should work the same as before
  const [users3, count3] = await orm.em.fork().findAndCount(User, { tags: { name: 'tag1' } });
  expect(count3).toBe(2);
  expect(users3).toHaveLength(2);
});

test('GH6681 - JOINED populate with M:N + limit keeps necessary joins in outer query', async () => {
  const mock = mockLogger(orm);

  const [users, count] = await orm.em
    .fork()
    .findAndCount(
      User,
      { tags: { name: 'tag1' } },
      { populate: ['tags'], strategy: LoadStrategy.JOINED, limit: 1, orderBy: { id: 'asc' } },
    );

  expect(count).toBe(2);
  expect(users).toHaveLength(1);
  expect(users[0].name).toBe('User1');
  expect(users[0].tags.isInitialized()).toBe(true);
  expect(users[0].tags).toHaveLength(2);

  // The outer query must keep the M:N joins for population
  const dataQuery = mock.mock.calls.find(
    call => call[0]?.includes('select') && call[0]?.includes('in (select'),
  )?.[0] as string;
  expect(dataQuery).toBeDefined();
  const outerQuery = dataQuery.split('where')[0];
  expect(outerQuery).toContain('join');
});

test('GH6681 - JOINED populate with OneToMany + limit keeps necessary joins in outer query', async () => {
  const mock = mockLogger(orm);

  const [users, count] = await orm.em
    .fork()
    .findAndCount(
      User,
      {},
      { populate: ['comments'], strategy: LoadStrategy.JOINED, limit: 1, orderBy: { id: 'asc' } },
    );

  expect(count).toBe(2);
  expect(users).toHaveLength(1);
  expect(users[0].name).toBe('User1');
  expect(users[0].comments.isInitialized()).toBe(true);
  expect(users[0].comments).toHaveLength(2);

  // The outer query must keep the OneToMany join for population
  const dataQuery = mock.mock.calls.find(
    call => call[0]?.includes('select') && call[0]?.includes('in (select'),
  )?.[0] as string;
  expect(dataQuery).toBeDefined();
  const outerQuery = dataQuery.split('where')[0];
  expect(outerQuery).toContain('join');
});

test('GH6681 - ORDER BY on joined relation + limit keeps the join', async () => {
  const mock = mockLogger(orm);

  const users = await orm.em
    .fork()
    .find(User, { tags: { name: 'tag1' } }, { limit: 1, orderBy: { tags: { name: 'asc' } } });

  expect(users).toHaveLength(1);

  // The outer query must keep the join used for ORDER BY
  const dataQuery = mock.mock.calls.find(
    call => call[0]?.includes('select') && call[0]?.includes('in (select'),
  )?.[0] as string;
  expect(dataQuery).toBeDefined();
  const outerQuery = dataQuery.split('where')[0];
  expect(outerQuery).toContain('join');
});
