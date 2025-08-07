import { Entity, MikroORM, PrimaryKey, Property, ManyToOne, OneToMany, Collection, Rel } from '@mikro-orm/sqlite';

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
  orm.em.addFilter('tenant', { forum: { tenant: 'A' } }, Post);
});

afterAll(async () => {
  await orm.close(true);
});

test('filters on joined entities when using populate', async () => {
  const posts = await orm.em.findAll(Post);
  expect(posts.length).toBe(1);

  const userWithPostsSelectIn = await orm.em.fork().findOneOrFail(User, 1, {
    populate: ['posts'],
    strategy: 'select-in',
  });
  expect(userWithPostsSelectIn.posts.length).toBe(1);

  const userWithPostsJoined = await orm.em.fork().findOneOrFail(User, 1, {
    populate: ['posts'],
    strategy: 'joined',
  });
  expect(userWithPostsJoined.posts.length).toBe(1);

  const userWithPostsBalanced = await orm.em.fork().findOneOrFail(User, 1, {
    populate: ['posts'],
    strategy: 'balanced',
  });
  expect(userWithPostsBalanced.posts.length).toBe(1);
});
