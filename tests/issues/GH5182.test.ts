import { Collection, MikroORM } from '@mikro-orm/sqlite';

import { Entity, ManyToMany, PrimaryKey, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
@Entity()
class Author {

  @PrimaryKey()
  id!: number;

  @ManyToMany(() => Tag)
  tags = new Collection<Tag>(this);

  @ManyToMany(() => Post)
  posts = new Collection<Post>(this);

}

@Entity()
class Tag {

  @PrimaryKey()
  id!: number;

  @ManyToMany(() => Post)
  posts = new Collection<Post>(this);

  @ManyToMany(() => Author, 'tags')
  authors = new Collection<Post>(this);

}

@Entity()
class Post {

  @PrimaryKey()
  id!: number;

  @ManyToMany(() => Tag, 'posts')
  tags = new Collection<Tag>(this);

  @ManyToMany(() => Author, 'posts')
  authors = new Collection<Author>(this);

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: ':memory:',
    entities: [Author, Post, Tag],
  });
  await orm.schema.createSchema();

  const author1 = orm.em.create(Author, { id: 1 });
  const author2 = orm.em.create(Author, { id: 2 });
  const tag1 = orm.em.create(Tag, { id: 1 });
  const post1 = orm.em.create(Post, { id: 1 });
  const post2 = orm.em.create(Post, { id: 2 });

  author1.tags.add(tag1);
  author1.posts.add(post1);
  tag1.posts.add(post1);

  author2.tags.add(tag1);
  author2.posts.add(post2);
  tag1.posts.add(post2);

  await orm.em.flush();
  orm.em.clear();
});

afterAll(() => orm.close(true));

test('it should map the entities correctly', async () => {
  const fork = orm.em.fork();
  const result = await fork
    .qb(Author, 'a')
    .select('*')
    .leftJoinAndSelect('a.tags', 't')
    .leftJoinAndSelect('t.posts', 'p')
    .leftJoin('p.authors', 'a2')
    .where('a.id = a2.id')
    .orderBy({ 'a.id': 'DESC', 'p.id': 'DESC' })
    .getSingleResult();
  expect(result!.tags[0].posts[0].id).toBe(2);
});

test('the above test should return the same result as this one', async () => {
  const fork = orm.em.fork();
  const result = await fork
    .qb(Author, 'a')
    .select('*')
    .leftJoinAndSelect('a.tags', 't')
    .leftJoinAndSelect('t.posts', 'p')
    .leftJoin('p.authors', 'a2')
    .where('a.id = a2.id')
    .orderBy({ 'a.id': 'DESC' })
    .execute();
  const authors = result.map(r => fork.fork().map(Author, r));
  expect(authors[0].tags[0].posts[0].id).toBe(2);
});
