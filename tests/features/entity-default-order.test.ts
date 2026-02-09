import { defineEntity, LoadStrategy, MikroORM, p, QueryOrder } from '@mikro-orm/sqlite';
import { mockLogger } from '../bootstrap.js';

const Profile = defineEntity({
  name: 'Profile',
  orderBy: { bio: QueryOrder.ASC },
  properties: {
    id: p.integer().primary(),
    bio: p.string(),
    author: () => p.oneToOne(Author).owner(),
  },
});

const Author = defineEntity({
  name: 'Author',
  orderBy: { name: QueryOrder.ASC },
  properties: {
    id: p.integer().primary(),
    name: p.string(),
    posts: () => p.oneToMany(Post).mappedBy('author'),
    profile: () => p.oneToOne(Profile).mappedBy('author').nullable(),
  },
});

const Post = defineEntity({
  name: 'Post',
  orderBy: { createdAt: QueryOrder.DESC },
  properties: {
    id: p.integer().primary(),
    title: p.string(),
    createdAt: p.datetime(),
    author: () => p.manyToOne(Author),
    comments: () => p.oneToMany(Comment).mappedBy('post'),
    commentsAlphabetical: () => p.oneToMany(Comment).mappedBy('post').orderBy({ text: QueryOrder.ASC }),
    tags: () => p.manyToMany(Tag).inversedBy('posts').owner(),
    tagsReversed: () => p.manyToMany(Tag).inversedBy('posts').owner().orderBy({ title: QueryOrder.DESC }),
  },
});

const Comment = defineEntity({
  name: 'Comment',
  orderBy: { createdAt: QueryOrder.DESC, id: QueryOrder.DESC },
  properties: {
    id: p.integer().primary(),
    text: p.string(),
    createdAt: p.datetime(),
    post: () => p.manyToOne(Post),
    replies: () => p.oneToMany(Reply).mappedBy('comment'),
  },
});

const Reply = defineEntity({
  name: 'Reply',
  orderBy: { createdAt: QueryOrder.ASC },
  properties: {
    id: p.integer().primary(),
    text: p.string(),
    createdAt: p.datetime(),
    comment: () => p.manyToOne(Comment),
  },
});

const Tag = defineEntity({
  name: 'Tag',
  orderBy: { title: QueryOrder.ASC },
  properties: {
    id: p.integer().primary(),
    title: p.string(),
    posts: () => p.manyToMany(Post).mappedBy('tags'),
  },
});

const Item = defineEntity({
  name: 'Item',
  orderBy: { priority: QueryOrder.DESC, name: QueryOrder.ASC },
  properties: {
    id: p.integer().primary(),
    name: p.string(),
    priority: p.integer(),
  },
});

// Test that `extends` with spread base properties works with orderBy on base keys
const BaseProperties = {
  id: p.integer().primary(),
  createdAt: p.datetime(),
};

const BaseEntity = defineEntity({
  name: 'BaseEntity',
  abstract: true,
  properties: BaseProperties,
});

const Event = defineEntity({
  name: 'Event',
  extends: BaseEntity,
  orderBy: { createdAt: QueryOrder.DESC },
  properties: {
    title: p.string(),
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Author, Post, Comment, Reply, Tag, Item, Event, Profile],
    dbName: ':memory:',
  });

  await orm.schema.refresh();
  await createTestData();
});

beforeEach(() => orm.em.clear());
afterAll(() => orm.close(true));

async function createTestData() {
  const em = orm.em.fork();

  const author1 = em.create(Author, { name: 'Charlie' });
  const author2 = em.create(Author, { name: 'Alice' });
  em.create(Author, { name: 'Bob' });

  em.create(Profile, { bio: 'Charlie bio', author: author1 });
  em.create(Profile, { bio: 'Alice bio', author: author2 });

  const post1 = em.create(Post, { title: 'Post 1', createdAt: new Date('2024-01-15'), author: author1 });
  const post2 = em.create(Post, { title: 'Post 2', createdAt: new Date('2024-01-20'), author: author1 });
  em.create(Post, { title: 'Post 3', createdAt: new Date('2024-01-10'), author: author1 });

  const c1 = em.create(Comment, { text: 'First comment', createdAt: new Date('2024-01-01'), post: post1 });
  em.create(Comment, { text: 'Second comment', createdAt: new Date('2024-01-03'), post: post1 });
  em.create(Comment, { text: 'Third comment', createdAt: new Date('2024-01-02'), post: post1 });

  em.create(Reply, { text: 'Reply A', createdAt: new Date('2024-01-01T12:00:00'), comment: c1 });
  em.create(Reply, { text: 'Reply B', createdAt: new Date('2024-01-01T10:00:00'), comment: c1 });
  em.create(Reply, { text: 'Reply C', createdAt: new Date('2024-01-01T11:00:00'), comment: c1 });

  const tag1 = em.create(Tag, { title: 'Zebra' });
  const tag2 = em.create(Tag, { title: 'Apple' });
  const tag3 = em.create(Tag, { title: 'Banana' });

  post1.tags.add(tag1, tag2, tag3);
  post1.tagsReversed.add(tag1, tag2, tag3);
  post2.tags.add(tag2, tag3);

  em.create(Item, { name: 'Item A', priority: 1 });
  em.create(Item, { name: 'Item B', priority: 3 });
  em.create(Item, { name: 'Item C', priority: 2 });
  em.create(Item, { name: 'Item D', priority: 3 });

  em.create(Event, { title: 'Event A', createdAt: new Date('2024-03-01') });
  em.create(Event, { title: 'Event B', createdAt: new Date('2024-01-01') });
  em.create(Event, { title: 'Event C', createdAt: new Date('2024-02-01') });

  await em.flush();
}

describe('entity-level default orderBy', () => {

  describe('em.find() with entity-level orderBy', () => {

    test('applies entity-level orderBy when querying directly', async () => {
      const comments = await orm.em.find(Comment, {});
      expect(comments.map(c => c.text)).toEqual([
        'Second comment',
        'Third comment',
        'First comment',
      ]);
    });

    test('runtime orderBy overrides entity-level orderBy', async () => {
      const comments = await orm.em.find(Comment, {}, {
        orderBy: { text: QueryOrder.ASC },
      });
      expect(comments.map(c => c.text)).toEqual([
        'First comment',
        'Second comment',
        'Third comment',
      ]);
    });

    test('runtime orderBy for same key as entity-level deduplicates', async () => {
      const mock = mockLogger(orm);
      // Comment entity has orderBy: { createdAt: DESC, id: DESC }
      // Runtime specifies createdAt ASC — should dedup createdAt, append id as tiebreaker
      await orm.em.find(Comment, {}, {
        orderBy: { createdAt: QueryOrder.ASC },
      });
      const sql = mock.mock.calls[0][0];
      // createdAt should appear exactly once in the order by clause
      const orderByPart = sql.split('order by')[1];
      const createdAtCount = (orderByPart.match(/created_at/g) || []).length;
      expect(createdAtCount).toBe(1);
      // id should be appended as tiebreaker
      expect(orderByPart).toMatch(/created_at.*asc/);
      expect(orderByPart).toMatch(/id.*desc/);
    });

    test('runtime orderBy on different key appends entity-level as tiebreaker', async () => {
      const mock = mockLogger(orm);
      // Comment entity has orderBy: { createdAt: DESC, id: DESC }
      // Runtime specifies text ASC — should append createdAt and id as tiebreakers
      await orm.em.find(Comment, {}, {
        orderBy: { text: QueryOrder.ASC },
      });
      const sql = mock.mock.calls[0][0];
      const orderByPart = sql.split('order by')[1];
      // text first, then createdAt and id as tiebreakers
      expect(orderByPart).toMatch(/text.*asc.*created_at.*desc.*id.*desc/s);
    });

    test('works with findAll', async () => {
      const tags = await orm.em.findAll(Tag);
      expect(tags.map(t => t.title)).toEqual(['Apple', 'Banana', 'Zebra']);
    });

    test('works with findAndCount', async () => {
      const [comments, count] = await orm.em.findAndCount(Comment, {});
      expect(count).toBe(3);
      expect(comments.map(c => c.text)).toEqual([
        'Second comment',
        'Third comment',
        'First comment',
      ]);
    });

    test('works with multi-column entity-level orderBy', async () => {
      const items = await orm.em.find(Item, {});
      expect(items.map(i => `${i.name}:${i.priority}`)).toEqual([
        'Item B:3',
        'Item D:3',
        'Item C:2',
        'Item A:1',
      ]);
    });

  });

  describe('populate with entity-level orderBy', () => {

    test('entity-level orderBy applies when populating relations', async () => {
      const post = await orm.em.findOneOrFail(Post, { title: 'Post 1' }, {
        populate: ['comments'],
      });
      expect(post.comments.getItems().map(c => c.text)).toEqual([
        'Second comment',
        'Third comment',
        'First comment',
      ]);
    });

    test('relation-level orderBy overrides entity-level orderBy', async () => {
      const post = await orm.em.findOneOrFail(Post, { title: 'Post 1' }, {
        populate: ['commentsAlphabetical'],
      });
      expect(post.commentsAlphabetical.getItems().map(c => c.text)).toEqual([
        'First comment',
        'Second comment',
        'Third comment',
      ]);
    });

    test('runtime orderBy overrides both relation and entity-level orderBy', async () => {
      const post = await orm.em.findOneOrFail(Post, { title: 'Post 1' }, {
        populate: ['comments'],
        orderBy: { comments: { createdAt: QueryOrder.ASC } },
      });
      expect(post.comments.getItems().map(c => c.text)).toEqual([
        'First comment',
        'Third comment',
        'Second comment',
      ]);
    });

  });

  describe('Collection.init() with entity-level orderBy', () => {

    test('Collection.init() uses entity-level orderBy', async () => {
      const post = await orm.em.findOneOrFail(Post, { title: 'Post 1' });
      await post.comments.init();
      expect(post.comments.getItems().map(c => c.text)).toEqual([
        'Second comment',
        'Third comment',
        'First comment',
      ]);
    });

    test('Collection.init() with explicit orderBy overrides entity-level', async () => {
      const post = await orm.em.findOneOrFail(Post, { title: 'Post 1' });
      await post.comments.init({ orderBy: { text: QueryOrder.ASC } });
      expect(post.comments.getItems().map(c => c.text)).toEqual([
        'First comment',
        'Second comment',
        'Third comment',
      ]);
    });

  });

  describe('Collection.matching() with entity-level orderBy', () => {

    test('Collection.matching() uses entity-level orderBy', async () => {
      const post = await orm.em.findOneOrFail(Post, { title: 'Post 1' });
      const comments = await post.comments.matching({});
      expect(comments.map(c => c.text)).toEqual([
        'Second comment',
        'Third comment',
        'First comment',
      ]);
    });

    test('Collection.matching() with explicit orderBy overrides', async () => {
      const post = await orm.em.findOneOrFail(Post, { title: 'Post 1' });
      const comments = await post.comments.matching({ orderBy: { text: QueryOrder.DESC } });
      expect(comments.map(c => c.text)).toEqual([
        'Third comment',
        'Second comment',
        'First comment',
      ]);
    });

  });

  describe('LoadStrategy variations', () => {

    test('works with LoadStrategy.SELECT_IN', async () => {
      const mock = mockLogger(orm);
      const post = await orm.em.findOneOrFail(Post, { title: 'Post 1' }, {
        populate: ['comments'],
        strategy: LoadStrategy.SELECT_IN,
      });
      expect(post.comments.getItems().map(c => c.text)).toEqual([
        'Second comment',
        'Third comment',
        'First comment',
      ]);
      expect(mock.mock.calls.some(call =>
        call[0].includes('order by') &&
        call[0].includes('created_at') &&
        call[0].includes('desc'),
      )).toBe(true);
    });

    test('works with LoadStrategy.JOINED', async () => {
      const mock = mockLogger(orm);
      const post = await orm.em.findOneOrFail(Post, { title: 'Post 1' }, {
        populate: ['comments'],
        strategy: LoadStrategy.JOINED,
      });
      expect(post.comments.getItems().map(c => c.text)).toEqual([
        'Second comment',
        'Third comment',
        'First comment',
      ]);
      expect(mock.mock.calls.some(call =>
        call[0].includes('order by') &&
        call[0].includes('created_at'),
      )).toBe(true);
    });

  });

  describe('M:N relations with entity-level orderBy', () => {

    test('M:N relation uses target entity orderBy', async () => {
      const post = await orm.em.findOneOrFail(Post, { title: 'Post 1' }, {
        populate: ['tags'],
      });
      expect(post.tags.getItems().map(t => t.title)).toEqual([
        'Apple',
        'Banana',
        'Zebra',
      ]);
    });

    test('M:N relation with relation-level orderBy', async () => {
      const post = await orm.em.findOneOrFail(Post, { title: 'Post 1' }, {
        populate: ['tagsReversed'],
      });
      expect(post.tagsReversed.getItems().map(t => t.title)).toEqual([
        'Zebra',
        'Banana',
        'Apple',
      ]);
    });

  });

  describe('multiple orderBy columns', () => {

    test('multiple columns in entity-level orderBy work correctly', async () => {
      const items = await orm.em.find(Item, {});
      expect(items.map(i => i.name)).toEqual([
        'Item B',
        'Item D',
        'Item C',
        'Item A',
      ]);
    });

  });

  describe('extends with base properties', () => {

    test('orderBy on base property works with extends + spread', async () => {
      const events = await orm.em.find(Event, {});
      expect(events.map(e => e.title)).toEqual([
        'Event A',
        'Event C',
        'Event B',
      ]);
    });

  });

  describe('1:1 relations with entity-level orderBy', () => {

    test('1:1 inverse side auto-join does not crash with target entity orderBy', async () => {
      // Author has 1:1 inverse `profile` -> Profile which has orderBy: { bio: ASC }
      // The auto-join for 1:1 inverse should not try to apply targetMeta.orderBy
      const authors = await orm.em.findAll(Author);
      expect(authors.map(a => a.name)).toEqual(['Alice', 'Bob', 'Charlie']);
    });

    test('1:1 inverse side with explicit populate does not apply target orderBy', async () => {
      const mock = mockLogger(orm);
      const authors = await orm.em.find(Author, {}, {
        populate: ['profile'],
      });
      expect(authors.map(a => a.name)).toEqual(['Alice', 'Bob', 'Charlie']);
      expect(authors[0].profile?.bio).toBe('Alice bio');
      // The ORDER BY clause should not contain profile's bio column
      const sql = mock.mock.calls[0][0];
      const orderByPart = sql.split('order by')[1];
      expect(orderByPart).not.toMatch(/bio/);
    });

    test('1:1 inverse with JOINED strategy does not crash', async () => {
      const authors = await orm.em.find(Author, {}, {
        populate: ['profile'],
        strategy: LoadStrategy.JOINED,
      });
      expect(authors.map(a => a.name)).toEqual(['Alice', 'Bob', 'Charlie']);
      expect(authors[0].profile?.bio).toBe('Alice bio');
      expect(authors[2].profile?.bio).toBe('Charlie bio');
    });

    test('1:1 inverse with SELECT_IN strategy does not crash', async () => {
      const authors = await orm.em.find(Author, {}, {
        populate: ['profile'],
        strategy: LoadStrategy.SELECT_IN,
      });
      expect(authors.map(a => a.name)).toEqual(['Alice', 'Bob', 'Charlie']);
      expect(authors[0].profile?.bio).toBe('Alice bio');
    });

    test('querying the 1:1 owner entity directly still applies its entity-level orderBy', async () => {
      const profiles = await orm.em.findAll(Profile);
      expect(profiles.map(p => p.bio)).toEqual(['Alice bio', 'Charlie bio']);
    });

  });

  describe('deeply nested relations', () => {

    test('3-level nesting with SELECT_IN: Author -> Posts -> Comments', async () => {
      const author = await orm.em.findOneOrFail(Author, { name: 'Charlie' }, {
        populate: ['posts.comments'],
        strategy: LoadStrategy.SELECT_IN,
      });

      expect(author.posts.getItems().map(x => x.title)).toEqual([
        'Post 2',
        'Post 1',
        'Post 3',
      ]);

      const post1 = author.posts.getItems().find(x => x.title === 'Post 1')!;
      expect(post1.comments.getItems().map(c => c.text)).toEqual([
        'Second comment',
        'Third comment',
        'First comment',
      ]);
    });

    test('3-level nesting with JOINED: Author -> Posts -> Comments', async () => {
      const author = await orm.em.findOneOrFail(Author, { name: 'Charlie' }, {
        populate: ['posts.comments'],
        strategy: LoadStrategy.JOINED,
      });

      expect(author.posts.getItems().map(x => x.title)).toEqual([
        'Post 2',
        'Post 1',
        'Post 3',
      ]);

      const post1 = author.posts.getItems().find(x => x.title === 'Post 1')!;
      expect(post1.comments.getItems().map(c => c.text)).toEqual([
        'Second comment',
        'Third comment',
        'First comment',
      ]);
    });

    test('4-level nesting: Author -> Posts -> Comments -> Replies', async () => {
      const author = await orm.em.findOneOrFail(Author, { name: 'Charlie' }, {
        populate: ['posts.comments.replies'],
        strategy: LoadStrategy.SELECT_IN,
      });

      const post1 = author.posts.getItems().find(x => x.title === 'Post 1')!;
      const firstComment = post1.comments.getItems().find(c => c.text === 'First comment')!;

      expect(firstComment.replies.getItems().map(r => r.text)).toEqual([
        'Reply B',
        'Reply C',
        'Reply A',
      ]);
    });

    test('mixed 1:m and m:n nesting with SELECT_IN: Author -> Posts -> Tags', async () => {
      const author = await orm.em.findOneOrFail(Author, { name: 'Charlie' }, {
        populate: ['posts.tags'],
        strategy: LoadStrategy.SELECT_IN,
      });

      expect(author.posts.getItems().map(x => x.title)).toEqual([
        'Post 2',
        'Post 1',
        'Post 3',
      ]);

      const post1 = author.posts.getItems().find(x => x.title === 'Post 1')!;
      expect(post1.tags.getItems().map(t => t.title)).toEqual([
        'Apple',
        'Banana',
        'Zebra',
      ]);

      const post2 = author.posts.getItems().find(x => x.title === 'Post 2')!;
      expect(post2.tags.getItems().map(t => t.title)).toEqual([
        'Apple',
        'Banana',
      ]);
    });

    test('mixed 1:m and m:n nesting with JOINED: Author -> Posts -> Tags', async () => {
      const author = await orm.em.findOneOrFail(Author, { name: 'Charlie' }, {
        populate: ['posts.tags'],
        strategy: LoadStrategy.JOINED,
      });

      expect(author.posts.getItems().map(x => x.title)).toEqual([
        'Post 2',
        'Post 1',
        'Post 3',
      ]);

      const post1 = author.posts.getItems().find(x => x.title === 'Post 1')!;
      expect(post1.tags.getItems().map(t => t.title)).toEqual([
        'Apple',
        'Banana',
        'Zebra',
      ]);
    });

    test('multiple nested paths populated together', async () => {
      const author = await orm.em.findOneOrFail(Author, { name: 'Charlie' }, {
        populate: ['posts.comments', 'posts.tags'],
        strategy: LoadStrategy.SELECT_IN,
      });

      const post1 = author.posts.getItems().find(x => x.title === 'Post 1')!;

      expect(post1.comments.getItems().map(c => c.text)).toEqual([
        'Second comment',
        'Third comment',
        'First comment',
      ]);
      expect(post1.tags.getItems().map(t => t.title)).toEqual([
        'Apple',
        'Banana',
        'Zebra',
      ]);
    });

    test('JOINED through a to-one applies entity-level orderBy to nested to-many', async () => {
      // Comment -> post (M:1, to-one) -> tags (M:N, to-many)
      // The recursion through the to-one `post` must propagate so that
      // Tag's entity-level orderBy { title: ASC } is applied in the SQL.
      const comment = await orm.em.findOneOrFail(Comment, { text: 'First comment' }, {
        populate: ['post.tags'],
        strategy: LoadStrategy.JOINED,
      });
      expect(comment.post.tags.getItems().map(t => t.title)).toEqual([
        'Apple',
        'Banana',
        'Zebra',
      ]);
    });

  });

});
