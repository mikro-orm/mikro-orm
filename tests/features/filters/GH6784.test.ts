import {
  Entity,
  MikroORM,
  PrimaryKey,
  Property,
  ManyToOne,
  OneToMany,
  Collection,
  Rel,
  LoadStrategy,
} from '@mikro-orm/sqlite';

@Entity()
class Forum {

  @PrimaryKey()
  id!: number;

  @OneToMany(() => Post, p => p.forum)
  posts = new Collection<Post>(this);

  @Property()
  tenant!: string;

}

@Entity()
class Post {

  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Forum, { nullable: true })
  forum?: Forum;

  @ManyToOne(() => User, { nullable: true })
  user?: Rel<User>;

}

@Entity()
class User {

  @PrimaryKey()
  id!: number;

  @OneToMany(() => Post, p => p.user)
  posts = new Collection<Post>(this);

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [User, Post, Forum],
  });
  await orm.schema.refreshDatabase();

  const forumA = orm.em.create(Forum, { posts: [], tenant: 'A' });
  const forumB = orm.em.create(Forum, { posts: [], tenant: 'B' });
  const user = orm.em.create(User, { id: 1, posts: [] });
  orm.em.create(Post, { forum: forumA, user });
  orm.em.create(Post, { forum: forumB, user });
  await orm.em.flush();
  orm.em.clear();
});

afterAll(async () => {
  await orm.close(true);
});

test.each(Object.values(LoadStrategy))('filters without populating relations when using "%s" strategy (strict)', async strategy => {
  orm.em.addFilter('tenant', { tenant: 'A' }, Forum, { strict: true });

  const posts = await orm.em.fork().findAll(Post);
  expect(posts.length).toBe(1);
  expect(posts[0].forum).not.toBeNull();

  const user = await orm.em.fork().findOneOrFail(User, 1, {
    populate: ['posts'],
    strategy,
  });
  expect(user.posts.length).toBe(1);
  expect(user.posts[0].forum).not.toBeNull();
});

test.each(Object.values(LoadStrategy))('filters on populated relations when using "%s" strategy (strict)', async strategy => {
  orm.em.addFilter('tenant', { tenant: 'A' }, Forum, { strict: true });

  const posts = await orm.em.fork().findAll(Post, { populate: ['forum'], strategy });
  expect(posts.length).toBe(1);
  expect(posts[0].forum?.tenant).toBe('A');

  const user = await orm.em.fork().findOneOrFail(User, 1, {
    populate: ['posts.forum'],
    strategy,
  });
  expect(user.posts.length).toBe(1);
  expect(user.posts[0].forum?.tenant).toBe('A');
});

test.each(Object.values(LoadStrategy))('filters without populated relations when using "%s" strategy (non-strict)', async strategy => {
  orm.em.addFilter('tenant', { tenant: 'A' }, Forum, { strict: false });

  const posts = await orm.em.fork().findAll(Post);
  expect(posts.length).toBe(2);
  expect(posts[0].forum).not.toBeNull();
  expect(posts[1].forum).toBeNull();

  const user = await orm.em.fork().findOneOrFail(User, 1, {
    populate: ['posts'],
    strategy,
  });
  expect(user.posts.length).toBe(2);
  expect(user.posts[0].forum).not.toBeNull();
  expect(user.posts[1].forum).toBeNull();
});

test.each(Object.values(LoadStrategy))('filters on populated relations when using "%s" strategy (non-strict)', async strategy => {
  orm.em.addFilter('tenant', { tenant: 'A' }, Forum, { strict: false });

  const posts = await orm.em.fork().findAll(Post, { populate: ['forum'], strategy });
  expect(posts.length).toBe(2);
  expect(posts[0].forum?.tenant).toBe('A');
  expect(posts[1].forum).toBeNull();

  const user = await orm.em.fork().findOneOrFail(User, 1, {
    populate: ['posts.forum'],
    strategy,
  });
  expect(user.posts.length).toBe(2);
  expect(user.posts[0].forum?.tenant).toBe('A');
  expect(user.posts[1].forum).toBeNull();
});
