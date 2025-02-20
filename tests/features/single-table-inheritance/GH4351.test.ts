import { MikroORM } from '@mikro-orm/sqlite';
import { Collection, Entity, Enum, ManyToMany, ManyToOne, OneToMany, PrimaryKey, Property, Rel } from '@mikro-orm/core';

@Entity()
class User {

  @PrimaryKey()
  id!: number;

  @Property({ nullable: true })
  name?: string;

  @OneToMany(() => Post, post => post.user)
  posts = new Collection<Post>(this);

  @ManyToMany(() => Post)
  posts2 = new Collection<Post>(this);

}

@Entity({
  discriminatorColumn: 'type',
  abstract: true,
})
abstract class BaseEntity {

  @PrimaryKey()
  id!: number;

  @Enum()
  type!: 'post' | 'comment';

  @ManyToOne(() => User, {
    fieldName: 'userId',
    deleteRule: 'set null',
    nullable: true,
    ref: true,
  })
  user?: Rel<User>;

}

@Entity({ discriminatorValue: 'post' })
class Post extends BaseEntity {

  @Property({ nullable: true })
  postField?: string;

}

@Entity({ discriminatorValue: 'comment' })
class Comment extends BaseEntity {

  @Property({ nullable: true })
  commentField?: string;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [BaseEntity, Post, Comment],
  });
  await orm.schema.createSchema();
});

afterAll(async () => {
  await orm.close(true);
});

test('it should add discriminator to the query', async () => {
  const user = new User();
  user.posts2.add(new Post());
  const post = new Post();
  post.user = user;
  const comment = new Comment();
  comment.user = user;

  await orm.em.fork().persistAndFlush([user, post, comment]);

  const qb1 = orm.em.qb(User, 'u').join('u.posts', 'p');
  const res1 = await qb1.getResult();
  expect(qb1.getFormattedQuery()).toMatch("select `u`.* from `user` as `u` inner join `base_entity` as `p` on `u`.`id` = `p`.`userId` and `p`.`type` = 'post'");
  expect(res1).toHaveLength(1);

  const qb2 = orm.em.qb(Post, 'p');
  const res2 = await qb2.getResult();
  expect(qb2.getFormattedQuery()).toMatch("select `p`.* from `base_entity` as `p` where `p`.`type` = 'post'");
  expect(res2).toHaveLength(2);

  const qb3 = orm.em.qb(User, 'u').join('u.posts2', 'p');
  const res3 = await qb3.getResult();
  expect(qb3.getFormattedQuery()).toMatch("select `u`.* from `user` as `u` inner join `user_posts2` as `u1` on `u`.`id` = `u1`.`user_id` inner join `base_entity` as `p` on `u1`.`base_entity_id` = `p`.`id` and `p`.`type` = 'post'");
  expect(res3).toHaveLength(1);
});
