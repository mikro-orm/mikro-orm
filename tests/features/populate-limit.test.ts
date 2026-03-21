import { Collection, LoadStrategy, MikroORM, ref, Ref } from '@mikro-orm/sqlite';
import {
  Entity,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryKey,
  Property,
  ReflectMetadataProvider,
} from '@mikro-orm/decorators/legacy';
import { mockLogger } from '../bootstrap.js';

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
class Comment {
  @PrimaryKey()
  id!: number;

  @Property()
  text!: string;

  @Property()
  createdAt!: Date;

  @ManyToOne(() => Post)
  post!: Ref<Post>;
}

@Entity()
class Post {
  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

  @Property()
  createdAt!: Date;

  @ManyToOne(() => User)
  user!: Ref<User>;

  @OneToMany(() => Comment, c => c.post)
  comments = new Collection<Comment>(this);

  @ManyToMany(() => Tag)
  tags = new Collection<Tag>(this);
}

@Entity()
class User {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @OneToMany(() => Post, p => p.user)
  posts = new Collection<Post>(this);
}

describe('populate with limit (per-parent limiting)', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [User, Post, Comment, Tag],
      dbName: ':memory:',
      metadataProvider: ReflectMetadataProvider,
    });
    await orm.schema.refresh();

    // Create 3 users, each with 5 posts
    const em = orm.em.fork();
    const tag1 = em.create(Tag, { name: 'tech' });
    const tag2 = em.create(Tag, { name: 'science' });

    let postIdx = 0;
    let commentIdx = 0;

    for (let u = 1; u <= 3; u++) {
      const user = em.create(User, { name: `User ${u}` });

      for (let p = 1; p <= 5; p++) {
        postIdx++;
        const post = em.create(Post, {
          title: `Post ${p} by User ${u}`,
          createdAt: new Date(2024, 0, postIdx), // Jan 1, Jan 2, ... Jan 15
          user: ref(user),
        });
        post.tags.add(p % 2 === 0 ? tag1 : tag2);

        // Each post gets 3 comments
        for (let c = 1; c <= 3; c++) {
          commentIdx++;
          em.create(Comment, {
            text: `Comment ${c} on Post ${p} by User ${u}`,
            createdAt: new Date(2024, 1, commentIdx), // Feb 1, Feb 2, ...
            post: ref(post),
          });
        }
      }
    }

    await em.flush();
  });

  afterAll(() => orm.close(true));

  beforeEach(() => orm.em.clear());

  test('1:M populate with limit per parent', async () => {
    const mock = mockLogger(orm, ['query']);
    const users = await orm.em.find(
      User,
      {},
      {
        populate: ['posts'],
        populateHints: {
          posts: { limit: 2, orderBy: { createdAt: 'desc' } },
        },
        orderBy: { name: 'asc' },
      },
    );

    expect(users).toHaveLength(3);

    // Each user should have at most 2 posts (the most recent ones)
    for (const user of users) {
      expect(user.posts.length).toBeLessThanOrEqual(2);
      expect(user.posts.length).toBeGreaterThan(0);
    }

    // Verify the SQL uses ROW_NUMBER
    const queries = mock.mock.calls.map(c => c[0]);
    const populateQuery = queries.find(q => q.includes('row_number'));
    expect(populateQuery).toBeDefined();
    expect(populateQuery).toContain('partition by');
  });

  test('1:M populate with limit and offset', async () => {
    const users = await orm.em.find(
      User,
      { name: 'User 1' },
      {
        populate: ['posts'],
        populateHints: {
          posts: { limit: 2, offset: 1, orderBy: { createdAt: 'desc' } },
        },
      },
    );

    expect(users).toHaveLength(1);
    // User 1 has 5 posts; skip 1, take 2 => should get 2 posts
    expect(users[0].posts.length).toBe(2);
  });

  test('limited collection is partial and readonly', async () => {
    const users = await orm.em.find(
      User,
      { name: 'User 1' },
      {
        populate: ['posts'],
        populateHints: {
          posts: { limit: 2 },
        },
      },
    );

    expect(users).toHaveLength(1);
    const posts = users[0].posts;
    expect(posts.isInitialized()).toBe(true);

    // Collection should be readonly — cannot add or remove
    expect(() =>
      posts.add(
        orm.em.create(Post, {
          title: 'new',
          createdAt: new Date(),
          user: ref(users[0]),
        }),
      ),
    ).toThrow(/marked as readonly/i);
  });

  test('M:N populate with limit via pivot table', async () => {
    const mock = mockLogger(orm, ['query']);
    const tags = await orm.em.find(
      Tag,
      {},
      {
        populate: ['posts'],
        populateHints: {
          posts: { limit: 2 },
        },
      },
    );

    expect(tags).toHaveLength(2);

    for (const tag of tags) {
      expect(tag.posts.length).toBeLessThanOrEqual(2);
    }
  });

  test('nested populate with different limits per level', async () => {
    const users = await orm.em.find(
      User,
      {},
      {
        populate: ['posts.comments'],
        populateHints: {
          posts: { limit: 2, orderBy: { createdAt: 'desc' } },
          'posts.comments': { limit: 1, orderBy: { createdAt: 'desc' } },
        },
        orderBy: { name: 'asc' },
      },
    );

    expect(users).toHaveLength(3);

    for (const user of users) {
      expect(user.posts.length).toBeLessThanOrEqual(2);

      for (const post of user.posts) {
        expect(post.comments.length).toBeLessThanOrEqual(1);
      }
    }
  });

  test('populateHints orderBy takes precedence over nested FindOptions orderBy', async () => {
    const mock = mockLogger(orm, ['query']);
    // Use orderBy in both populateHints and FindOptions — populateHints should win
    const users = await orm.em.find(
      User,
      { name: 'User 1' },
      {
        populate: ['posts'],
        orderBy: { posts: { createdAt: 'asc' } },
        populateHints: {
          posts: { limit: 2, orderBy: { createdAt: 'desc' } },
        },
      },
    );

    expect(users).toHaveLength(1);
    expect(users[0].posts.length).toBe(2);

    // The posts should be in descending order (populateHints orderBy)
    const dates = users[0].posts.getItems().map(p => p.createdAt.getTime());
    expect(dates[0]).toBeGreaterThan(dates[1]);
  });

  test('JOINED strategy is forced to SELECT_IN when limit is set', async () => {
    const mock = mockLogger(orm, ['query']);
    const users = await orm.em.find(
      User,
      {},
      {
        populate: ['posts'],
        strategy: LoadStrategy.JOINED,
        populateHints: {
          posts: { limit: 2 },
        },
      },
    );

    expect(users).toHaveLength(3);

    // Should NOT use JOIN for posts — should use separate SELECT_IN query with ROW_NUMBER
    const queries = mock.mock.calls.map(c => c[0]);
    const populateQuery = queries.find(q => q.includes('row_number'));
    expect(populateQuery).toBeDefined();
  });

  test('em.populate() with populateHints', async () => {
    const users = await orm.em.find(User, {});
    orm.em.clear();

    // Re-load users without populate, then use em.populate() with hints
    const reloadedUsers = await orm.em.find(User, {});
    await orm.em.populate(reloadedUsers, ['posts'], {
      populateHints: {
        posts: { limit: 2, orderBy: { createdAt: 'desc' } },
      },
    });

    for (const user of reloadedUsers) {
      expect(user.posts.length).toBeLessThanOrEqual(2);
    }
  });

  test('populate without limit loads all items', async () => {
    const users = await orm.em.find(
      User,
      { name: 'User 1' },
      {
        populate: ['posts'],
      },
    );

    // Without limit, all 5 posts should be loaded
    expect(users[0].posts.length).toBe(5);
  });
});
