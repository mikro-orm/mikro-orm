import { Collection, Entity, ManyToOne, OneToMany, PrimaryKey } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/sqlite';

@Entity()
export class User {

  @PrimaryKey()
  id!: string;

  @OneToMany(() => Post, post => post.user)
  posts = new Collection<Post>(this);

}

@Entity()
export class Post {

  @PrimaryKey()
  id!: string;

  @OneToMany(() => Comment, comment => comment.post)
  comments = new Collection<Comment>(this);

  @ManyToOne()
  user!: User;

}

@Entity()
class Comment {

  @PrimaryKey()
  id!: string;

  @ManyToOne()
  post!: Post;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [Comment, Post, User],
  });
  await orm.schema.refreshDatabase();
  orm.em.create(User, { id: 'user1' });
  orm.em.create(Post, { id: 'post1', user: 'user1' });
  orm.em.create(Comment, { id: 'comment', post: 'post1' });
  await orm.em.flush();
});

beforeEach(() => orm.em.clear());
afterAll(() => orm.close(true));

test('it should select comments', async () => {
  const users2 = await orm.em.qb(User)
    .select('*')
    .joinAndSelect('posts', 'p')
    .leftJoinAndSelect('p.comments', 'c')
    .getResult();
  expect(users2[0].posts[0].comments[0]).toBeDefined();
});

test('it should select comments even if posts have already been selected', async () => {
  await orm.em.qb(Post).select('*').getResult();
  const users1 = await orm.em.qb(User)
    .select('*')
    .joinAndSelect('posts', 'p')
    .leftJoinAndSelect('p.comments', 'c')
    .getResult();
  expect(users1[0].posts[0].comments[0]).toBeDefined();
});
