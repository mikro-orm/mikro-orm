import { Collection, EntitySchema, LoadStrategy, MikroORM, QueryOrder } from '@mikro-orm/sqlite';
import { mockLogger } from '../bootstrap.js';

class Author {

  id!: number;
  name!: string;
  posts = new Collection<Post>(this);

  constructor(name: string) {
    this.name = name;
  }

}

class Post {

  id!: number;
  title!: string;
  createdAt!: Date;
  author!: Author;
  comments = new Collection<Comment>(this);
  commentsAlphabetical = new Collection<Comment>(this);
  tags = new Collection<Tag>(this);
  tagsReversed = new Collection<Tag>(this);

  constructor(title: string, createdAt: Date) {
    this.title = title;
    this.createdAt = createdAt;
  }

}

class Comment {

  id!: number;
  text!: string;
  createdAt!: Date;
  post!: Post;
  replies = new Collection<Reply>(this);

  constructor(text: string, createdAt: Date) {
    this.text = text;
    this.createdAt = createdAt;
  }

}

class Reply {

  id!: number;
  text!: string;
  createdAt!: Date;
  comment!: Comment;

  constructor(text: string, createdAt: Date) {
    this.text = text;
    this.createdAt = createdAt;
  }

}

class Tag {

  id!: number;
  title!: string;
  posts = new Collection<Post>(this);

  constructor(title: string) {
    this.title = title;
  }

}

const AuthorSchema = new EntitySchema<Author>({
  class: Author,
  orderBy: { name: QueryOrder.ASC },
  properties: {
    id: { type: 'number', primary: true },
    name: { type: 'string' },
    posts: { kind: '1:m', entity: () => Post, mappedBy: 'author' },
  },
});

const PostSchema = new EntitySchema<Post>({
  class: Post,
  orderBy: { createdAt: QueryOrder.DESC },
  properties: {
    id: { type: 'number', primary: true },
    title: { type: 'string' },
    createdAt: { type: 'Date' },
    author: { kind: 'm:1', entity: () => Author },
    comments: { kind: '1:m', entity: () => Comment, mappedBy: 'post' },
    commentsAlphabetical: {
      kind: '1:m',
      entity: () => Comment,
      mappedBy: 'post',
      orderBy: { text: QueryOrder.ASC },
    },
    tags: { kind: 'm:n', entity: () => Tag, inversedBy: 'posts', owner: true },
    tagsReversed: { kind: 'm:n', entity: () => Tag, inversedBy: 'posts', owner: true, orderBy: { title: QueryOrder.DESC } },
  },
});

const CommentSchema = new EntitySchema<Comment>({
  class: Comment,
  orderBy: { createdAt: QueryOrder.DESC, id: QueryOrder.DESC },
  properties: {
    id: { type: 'number', primary: true },
    text: { type: 'string' },
    createdAt: { type: 'Date' },
    post: { kind: 'm:1', entity: () => Post },
    replies: { kind: '1:m', entity: () => Reply, mappedBy: 'comment' },
  },
});

const ReplySchema = new EntitySchema<Reply>({
  class: Reply,
  orderBy: { createdAt: QueryOrder.ASC },
  properties: {
    id: { type: 'number', primary: true },
    text: { type: 'string' },
    createdAt: { type: 'Date' },
    comment: { kind: 'm:1', entity: () => Comment },
  },
});

const TagSchema = new EntitySchema<Tag>({
  class: Tag,
  orderBy: { title: QueryOrder.ASC },
  properties: {
    id: { type: 'number', primary: true },
    title: { type: 'string' },
    posts: { kind: 'm:n', entity: () => Post, mappedBy: 'tags' },
  },
});

interface IItem {
  id: number;
  name: string;
  priority: number;
}

const ItemSchema = new EntitySchema<IItem>({
  name: 'Item',
  orderBy: { priority: QueryOrder.DESC, name: QueryOrder.ASC },
  properties: {
    id: { type: 'number', primary: true },
    name: { type: 'string' },
    priority: { type: 'number' },
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [AuthorSchema, PostSchema, CommentSchema, ReplySchema, TagSchema, ItemSchema],
    dbName: ':memory:',
  });

  await orm.schema.refresh();
  await createTestData();
});

beforeEach(() => orm.em.clear());
afterAll(() => orm.close(true));

async function createTestData() {
  const em = orm.em.fork();

  const author1 = new Author('Charlie');
  const author2 = new Author('Alice');
  const author3 = new Author('Bob');

  const post1 = new Post('Post 1', new Date('2024-01-15'));
  post1.author = author1;
  const post2 = new Post('Post 2', new Date('2024-01-20'));
  post2.author = author1;
  const post3 = new Post('Post 3', new Date('2024-01-10'));
  post3.author = author1;

  const c1 = new Comment('First comment', new Date('2024-01-01'));
  c1.post = post1;
  const c2 = new Comment('Second comment', new Date('2024-01-03'));
  c2.post = post1;
  const c3 = new Comment('Third comment', new Date('2024-01-02'));
  c3.post = post1;

  const r1 = new Reply('Reply A', new Date('2024-01-01T12:00:00'));
  r1.comment = c1;
  const r2 = new Reply('Reply B', new Date('2024-01-01T10:00:00'));
  r2.comment = c1;
  const r3 = new Reply('Reply C', new Date('2024-01-01T11:00:00'));
  r3.comment = c1;

  const tag1 = new Tag('Zebra');
  const tag2 = new Tag('Apple');
  const tag3 = new Tag('Banana');

  post1.tags.add(tag1, tag2, tag3);
  post1.tagsReversed.add(tag1, tag2, tag3);
  post2.tags.add(tag2, tag3);

  em.persist([author1, author2, author3, post1, post2, post3, c1, c2, c3, r1, r2, r3]);

  for (const item of [
    { name: 'Item A', priority: 1 },
    { name: 'Item B', priority: 3 },
    { name: 'Item C', priority: 2 },
    { name: 'Item D', priority: 3 },
  ]) {
    em.create(ItemSchema, item);
  }

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

    test('works with EntitySchema definitions', async () => {
      const items = await orm.em.find(ItemSchema, {});
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
      const items = await orm.em.find(ItemSchema, {});
      expect(items.map(i => i.name)).toEqual([
        'Item B',
        'Item D',
        'Item C',
        'Item A',
      ]);
    });

  });

  describe('deeply nested relations', () => {

    test('3-level nesting with SELECT_IN: Author -> Posts -> Comments', async () => {
      const author = await orm.em.findOneOrFail(Author, { name: 'Charlie' }, {
        populate: ['posts.comments'],
        strategy: LoadStrategy.SELECT_IN,
      });

      expect(author.posts.getItems().map(p => p.title)).toEqual([
        'Post 2',
        'Post 1',
        'Post 3',
      ]);

      const post1 = author.posts.getItems().find(p => p.title === 'Post 1')!;
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

      expect(author.posts.getItems().map(p => p.title)).toEqual([
        'Post 2',
        'Post 1',
        'Post 3',
      ]);

      const post1 = author.posts.getItems().find(p => p.title === 'Post 1')!;
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

      const post1 = author.posts.getItems().find(p => p.title === 'Post 1')!;
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

      expect(author.posts.getItems().map(p => p.title)).toEqual([
        'Post 2',
        'Post 1',
        'Post 3',
      ]);

      const post1 = author.posts.getItems().find(p => p.title === 'Post 1')!;
      expect(post1.tags.getItems().map(t => t.title)).toEqual([
        'Apple',
        'Banana',
        'Zebra',
      ]);

      const post2 = author.posts.getItems().find(p => p.title === 'Post 2')!;
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

      expect(author.posts.getItems().map(p => p.title)).toEqual([
        'Post 2',
        'Post 1',
        'Post 3',
      ]);

      const post1 = author.posts.getItems().find(p => p.title === 'Post 1')!;
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

      const post1 = author.posts.getItems().find(p => p.title === 'Post 1')!;

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

  });

});
