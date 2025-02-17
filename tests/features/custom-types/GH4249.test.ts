import { Entity, ManyToOne, PrimaryKey, wrap } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/mysql';
import { mockLogger } from '../../helpers.js';

@Entity()
class Author {

  @PrimaryKey()
  id!: bigint;

}

@Entity()
class Post {

  @PrimaryKey()
  id!: number;

  @ManyToOne({ entity: () => Author })
  author: Author;

  constructor(author: Author) {
    this.author = author;
  }

}

let orm: MikroORM;
let postId: number;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: 'mikro_orm_4249',
    port: 3308,
    entities: [Author, Post],
  });
  await orm.schema.refreshDatabase();

  const em = orm.em.fork();
  const author = new Author();
  const post = new Post(author);
  em.persist(post);
  await em.flush();
  postId = post.id;
});

afterAll(async () => {
  await orm.close(true);
});

test('4249', async () => {
  const em = orm.em.fork();
  const post = await em.findOneOrFail(Post, postId);
  await wrap(post.author).init();

  const mock = mockLogger(orm);
  await em.flush();
  expect(mock.mock.calls).toEqual([]);
});
