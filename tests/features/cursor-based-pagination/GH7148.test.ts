import { Collection, Entity, ManyToMany, PrimaryKey, Property, MikroORM } from '@mikro-orm/sqlite';

@Entity()
class Tag {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @ManyToMany(() => Post, p => p.tags)
  posts = new Collection<Post>(this);

}

@Entity()
class Post {

  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

  @ManyToMany(() => Tag)
  tags = new Collection<Tag>(this);

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Tag, Post],
    dbName: ':memory:',
  });
  await orm.schema.refreshDatabase();

  // Create tags
  const tags: Tag[] = [];
  for (let i = 1; i <= 5; i++) {
    tags.push(orm.em.create(Tag, { id: i, name: `Tag ${i}` }));
  }

  // Create posts, each with multiple tags
  // Post 1 has 3 tags, Post 2 has 2 tags, Post 3 has 4 tags
  orm.em.create(Post, { id: 1, title: 'Post 1', tags: [tags[0], tags[1], tags[2]] });
  orm.em.create(Post, { id: 2, title: 'Post 2', tags: [tags[2], tags[3]] });
  orm.em.create(Post, { id: 3, title: 'Post 3', tags: [tags[0], tags[1], tags[3], tags[4]] });

  await orm.em.flush();
  orm.em.clear();
});

afterEach(() => orm.em.clear());

afterAll(() => orm.close(true));

test('cursor pagination with many-to-many populate should not limit related items', async () => {
  // Use findByCursor with first=2 (limit) and populate the many-to-many relation
  // The bug was that the limit (2) was being applied to the pivot table query,
  // causing only 2 tags to be loaded instead of all tags for the posts
  const cursor = await orm.em.findByCursor(Post, {}, {
    first: 2,
    orderBy: { id: 'asc' },
    populate: ['tags'],
  });

  expect(cursor.items).toHaveLength(2);
  expect(cursor.items[0].title).toBe('Post 1');
  expect(cursor.items[1].title).toBe('Post 2');

  // Post 1 should have all 3 tags, not just 2
  expect(cursor.items[0].tags.isInitialized()).toBe(true);
  expect(cursor.items[0].tags.getItems()).toHaveLength(3);
  expect(cursor.items[0].tags.getItems().map(t => t.name).sort()).toEqual(['Tag 1', 'Tag 2', 'Tag 3']);

  // Post 2 should have all 2 tags
  expect(cursor.items[1].tags.isInitialized()).toBe(true);
  expect(cursor.items[1].tags.getItems()).toHaveLength(2);
  expect(cursor.items[1].tags.getItems().map(t => t.name).sort()).toEqual(['Tag 3', 'Tag 4']);
});

test('cursor pagination with many-to-many populate and overfetch should not limit related items', async () => {
  // Same test but with explicit overfetch=true
  const cursor = await orm.em.findByCursor(Post, {}, {
    first: 2,
    orderBy: { id: 'asc' },
    populate: ['tags'],
    overfetch: true,
  });

  expect(cursor.items).toHaveLength(2);

  // Post 1 should have all 3 tags
  expect(cursor.items[0].tags.getItems()).toHaveLength(3);

  // Post 2 should have all 2 tags
  expect(cursor.items[1].tags.getItems()).toHaveLength(2);
});

test('cursor pagination using last instead of first should not limit related items', async () => {
  const cursor = await orm.em.findByCursor(Post, {}, {
    last: 2,
    orderBy: { id: 'asc' },
    populate: ['tags'],
  });

  expect(cursor.items).toHaveLength(2);
  expect(cursor.items[0].title).toBe('Post 2');
  expect(cursor.items[1].title).toBe('Post 3');

  // Post 2 should have all 2 tags
  expect(cursor.items[0].tags.getItems()).toHaveLength(2);

  // Post 3 should have all 4 tags
  expect(cursor.items[1].tags.getItems()).toHaveLength(4);
  expect(cursor.items[1].tags.getItems().map(t => t.name).sort()).toEqual(['Tag 1', 'Tag 2', 'Tag 4', 'Tag 5']);
});
