import { Collection, MikroORM } from '@mikro-orm/sqlite';
import { Entity, ManyToOne, OneToMany, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
class Post {

  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

  @Property()
  content!: string;

  // Inverse side of polymorphic relation
  @OneToMany(() => UserLike, like => like.likeable)
  likes = new Collection<UserLike>(this);

  constructor(title: string, content: string) {
    this.title = title;
    this.content = content;
  }

}

@Entity()
class Comment {

  @PrimaryKey()
  id!: number;

  @Property()
  text!: string;

  // Inverse side of polymorphic relation
  @OneToMany(() => UserLike, like => like.likeable)
  likes = new Collection<UserLike>(this);

  constructor(text: string) {
    this.text = text;
  }

}

@Entity()
class UserLike {

  @PrimaryKey()
  id!: number;

  // Expose discriminator for querying (persist: false since it's managed by the relation)
  @Property({ persist: false })
  likeableType?: string;

  // Polymorphic relation - can point to either Post or Comment
  @ManyToOne(() => [Post, Comment], { nullable: true })
  likeable!: Post | Comment | null;

}

describe('polymorphic relations in sqlite', () => {

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Post, Comment, UserLike],
      dbName: ':memory:',
      metadataProvider: ReflectMetadataProvider,
    });
    await orm.schema.create();
  });

  afterAll(async () => {
    await orm.close(true);
  });

  beforeEach(async () => {
    await orm.em.nativeDelete(UserLike, {});
    await orm.em.nativeDelete(Post, {});
    await orm.em.nativeDelete(Comment, {});
    orm.em.clear();
  });

  test('metadata is correctly initialized for polymorphic relation', async () => {
    const meta = orm.getMetadata().get(UserLike);
    const likeableProp = meta.properties.likeable;

    expect(likeableProp.polymorphic).toBe(true);
    expect(likeableProp.polymorphTargets).toHaveLength(2);
    expect(likeableProp.discriminator).toBe('likeable');
    expect(likeableProp.discriminatorMap).toBeDefined();
    expect(likeableProp.createForeignKeyConstraint).toBe(false);
  });

  test('schema has correct columns for polymorphic relation', async () => {
    const sql = await orm.schema.getCreateSchemaSQL();

    // Should have discriminator column and ID column
    expect(sql).toContain('likeable_type');
    expect(sql).toContain('likeable_id');
  });

  test('can hydrate polymorphic relation pointing to Post', async () => {
    // Insert test data directly using raw queries
    const connection = orm.em.getConnection();
    await connection.execute("INSERT INTO post (id, title, content) VALUES (1, 'Test Post', 'Test Content')");
    await connection.execute("INSERT INTO user_like (id, likeable_type, likeable_id) VALUES (1, 'post', 1)");

    // Load the entity with the polymorphic relation
    const like = await orm.em.findOne(UserLike, { id: 1 });

    expect(like).toBeDefined();
    expect(like!.likeable).toBeDefined();
    // The relation should be a reference to Post
    expect(like!.likeable!.constructor.name).toBe('Post');
  });

  test('can hydrate polymorphic relation pointing to Comment', async () => {
    // Insert test data directly using raw queries
    const connection = orm.em.getConnection();
    await connection.execute("INSERT INTO comment (id, text) VALUES (1, 'Test Comment')");
    await connection.execute("INSERT INTO user_like (id, likeable_type, likeable_id) VALUES (1, 'comment', 1)");

    // Load the entity with the polymorphic relation
    const like = await orm.em.findOne(UserLike, { id: 1 });

    expect(like).toBeDefined();
    expect(like!.likeable).toBeDefined();
    // The relation should be a reference to Comment
    expect(like!.likeable!.constructor.name).toBe('Comment');
  });

  test('can load polymorphic relation reference and initialize separately', async () => {
    // Insert test data directly using raw queries
    const connection = orm.em.getConnection();
    await connection.execute("INSERT INTO post (id, title, content) VALUES (1, 'My Post', 'Post content here')");
    await connection.execute("INSERT INTO user_like (id, likeable_type, likeable_id) VALUES (1, 'post', 1)");

    // Load without populate - just get the reference
    const like = await orm.em.findOne(UserLike, { id: 1 });

    expect(like).toBeDefined();
    expect(like!.likeable).toBeDefined();
    expect(like!.likeable!.constructor.name).toBe('Post');

    // Load the referenced entity separately to verify the ID is correct
    const post = await orm.em.findOne(Post, { id: 1 });
    expect(post).toBeDefined();
    expect(post!.title).toBe('My Post');
    expect(post!.content).toBe('Post content here');
  });

  test('can persist polymorphic relation pointing to Post', async () => {
    const post = new Post('Persisted Post', 'Persisted Content');

    // Create entity using new and directly assign the property
    const like = new UserLike();
    like.likeable = post;
    orm.em.persist(like);

    await orm.em.flush();
    orm.em.clear();

    // Verify the data was persisted correctly
    const connection = orm.em.getConnection();
    const rows = await connection.execute('SELECT * FROM user_like WHERE id = ?', [like.id]);
    expect(rows).toHaveLength(1);
    expect(rows[0].likeable_type).toBe('post');
    expect(rows[0].likeable_id).toBe(post.id);
  });

  test('can persist polymorphic relation pointing to Comment', async () => {
    const comment = new Comment('Persisted Comment');
    const like = orm.em.create(UserLike, { likeable: comment });
    await orm.em.flush();
    orm.em.clear();

    // Verify the data was persisted correctly
    const connection = orm.em.getConnection();
    const rows = await connection.execute('SELECT * FROM user_like WHERE id = ?', [like.id]);
    expect(rows).toHaveLength(1);
    expect(rows[0].likeable_type).toBe('comment');
    expect(rows[0].likeable_id).toBe(comment.id);
  });

  test('can load inverse side (OneToMany) for Post', async () => {
    // Insert test data directly using raw queries
    const connection = orm.em.getConnection();
    await connection.execute("INSERT INTO post (id, title, content) VALUES (1, 'Post 1', 'Content 1')");
    await connection.execute("INSERT INTO comment (id, text) VALUES (1, 'Comment 1')");
    await connection.execute("INSERT INTO user_like (id, likeable_type, likeable_id) VALUES (1, 'post', 1)");
    await connection.execute("INSERT INTO user_like (id, likeable_type, likeable_id) VALUES (2, 'post', 1)");
    await connection.execute("INSERT INTO user_like (id, likeable_type, likeable_id) VALUES (3, 'comment', 1)");

    // Load Post with its likes collection
    const post = await orm.em.findOne(Post, { id: 1 }, { populate: ['likes'] });

    expect(post).toBeDefined();
    expect(post!.likes).toBeDefined();
    expect(post!.likes.length).toBe(2); // Only likes pointing to posts, not comments
    expect(post!.likes[0].id).toBe(1);
    expect(post!.likes[1].id).toBe(2);
  });

  test('can load inverse side (OneToMany) for Comment', async () => {
    // Insert test data directly using raw queries
    const connection = orm.em.getConnection();
    await connection.execute("INSERT INTO post (id, title, content) VALUES (1, 'Post 1', 'Content 1')");
    await connection.execute("INSERT INTO comment (id, text) VALUES (1, 'Comment 1')");
    await connection.execute("INSERT INTO user_like (id, likeable_type, likeable_id) VALUES (1, 'post', 1)");
    await connection.execute("INSERT INTO user_like (id, likeable_type, likeable_id) VALUES (2, 'comment', 1)");
    await connection.execute("INSERT INTO user_like (id, likeable_type, likeable_id) VALUES (3, 'comment', 1)");

    // Load Comment with its likes collection
    const comment = await orm.em.findOne(Comment, { id: 1 }, { populate: ['likes'] });

    expect(comment).toBeDefined();
    expect(comment!.likes).toBeDefined();
    expect(comment!.likes.length).toBe(2); // Only likes pointing to comments, not posts
    expect(comment!.likes[0].id).toBe(2);
    expect(comment!.likes[1].id).toBe(3);
  });

  test('can populate polymorphic relation', async () => {
    // Insert test data
    const connection = orm.em.getConnection();
    await connection.execute("INSERT INTO post (id, title, content) VALUES (1, 'Post 1', 'Content 1')");
    await connection.execute("INSERT INTO comment (id, text) VALUES (1, 'Comment 1')");
    await connection.execute("INSERT INTO user_like (id, likeable_type, likeable_id) VALUES (1, 'post', 1)");
    await connection.execute("INSERT INTO user_like (id, likeable_type, likeable_id) VALUES (2, 'comment', 1)");

    // Load likes with populated likeable
    const likes = await orm.em.find(UserLike, {}, { populate: ['likeable'] });

    expect(likes).toHaveLength(2);
    const postLike = likes.find(l => l.id === 1)!;
    const commentLike = likes.find(l => l.id === 2)!;

    expect(postLike.likeable).toBeDefined();
    expect(postLike.likeable!.constructor.name).toBe('Post');
    expect((postLike.likeable as Post).title).toBe('Post 1');

    expect(commentLike.likeable).toBeDefined();
    expect(commentLike.likeable!.constructor.name).toBe('Comment');
    expect((commentLike.likeable as Comment).text).toBe('Comment 1');
  });

  test('can handle null polymorphic relation', async () => {
    // Insert a like with null likeable directly via raw SQL
    const connection = orm.em.getConnection();
    await connection.execute('INSERT INTO user_like (id, likeable_type, likeable_id) VALUES (1, NULL, NULL)');
    orm.em.clear();

    const loadedLike = await orm.em.findOneOrFail(UserLike, 1);
    expect(loadedLike.likeable).toBeNull();
  });

  test('can handle null polymorphic relation with joined loading', async () => {
    // Insert a like with null likeable directly via raw SQL
    const connection = orm.em.getConnection();
    await connection.execute('INSERT INTO user_like (id, likeable_type, likeable_id) VALUES (1, NULL, NULL)');
    orm.em.clear();

    // Use joined loading strategy to trigger mapJoinedProps code path
    const loadedLike = await orm.em.findOneOrFail(UserLike, 1, {
      populate: ['likeable'],
      strategy: 'joined',
    });
    expect(loadedLike.likeable).toBeNull();
  });

  test('handles mixed null and non-null polymorphic relations with joined loading', async () => {
    // Create entities: some with polymorphic relation, some with null
    const post = new Post('Mixed Test Post', 'Content');
    const like1 = new UserLike();
    like1.likeable = post;
    await orm.em.persist(like1).flush();

    // Insert a like with null likeable directly via raw SQL
    const connection = orm.em.getConnection();
    await connection.execute('INSERT INTO user_like (id, likeable_type, likeable_id) VALUES (999, NULL, NULL)');
    orm.em.clear();

    // Load all likes with joined strategy - this should trigger mapJoinedProps for both
    const likes = await orm.em.find(UserLike, {}, {
      populate: ['likeable'],
      strategy: 'joined',
      orderBy: { id: 'ASC' },
    });

    expect(likes).toHaveLength(2);
    expect(likes[0].likeable).toBeInstanceOf(Post);
    expect(likes[1].likeable).toBeNull();
  });

  test('batch loads multiple entities with polymorphic relations', async () => {
    const post1 = new Post('Post 1', 'Content 1');
    const post2 = new Post('Post 2', 'Content 2');
    const comment1 = new Comment('Comment 1');

    const like1 = new UserLike();
    like1.likeable = post1;
    const like2 = new UserLike();
    like2.likeable = post2;
    const like3 = new UserLike();
    like3.likeable = comment1;

    await orm.em.persist([like1, like2, like3]).flush();
    orm.em.clear();

    // Load all likes with populated likeables
    const likes = await orm.em.find(UserLike, {}, { populate: ['likeable'] });

    expect(likes).toHaveLength(3);
    // Should have loaded 2 Posts and 1 Comment
    const postLikes = likes.filter(l => l.likeable instanceof Post);
    const commentLikes = likes.filter(l => l.likeable instanceof Comment);
    expect(postLikes).toHaveLength(2);
    expect(commentLikes).toHaveLength(1);
  });

  test('can populate already-loaded entity reference', async () => {
    const post = new Post('My Post', 'Content');
    const like = new UserLike();
    like.likeable = post;
    await orm.em.persist(like).flush();
    orm.em.clear();

    // Load without clearing - entity reference already exists
    const loadedLike = await orm.em.findOneOrFail(UserLike, like.id);
    // At this point likeable is already hydrated
    expect(loadedLike.likeable).toBeInstanceOf(Post);

    // Populate again - should hit the __meta branch
    await orm.em.populate(loadedLike, ['likeable']);
    expect((loadedLike.likeable as Post).title).toBe('My Post');
  });

  test('handles entities without polymorphic relation value', async () => {
    // Insert a like with null values directly
    const connection = orm.em.getConnection();
    await connection.execute('INSERT INTO user_like (id, likeable_type, likeable_id) VALUES (99, NULL, NULL)');
    orm.em.clear();

    // Load without populate - should handle null gracefully
    const like = await orm.em.findOne(UserLike, 99);
    expect(like).toBeDefined();
    expect(like!.likeable).toBeNull();
  });

  test('populate multiple entities with mixed reference states', async () => {
    const post1 = new Post('Post 1', 'Content 1');
    const post2 = new Post('Post 2', 'Content 2');
    const comment = new Comment('Comment');

    const like1 = new UserLike();
    like1.likeable = post1;
    const like2 = new UserLike();
    like2.likeable = post2;
    const like3 = new UserLike();
    like3.likeable = comment;

    await orm.em.persist([like1, like2, like3]).flush();
    orm.em.clear();

    // Load likes - they will have entity references already hydrated
    const likes = await orm.em.find(UserLike, {});
    expect(likes).toHaveLength(3);

    // All should already have likeable as entity references
    for (const like of likes) {
      expect(like.likeable).toBeDefined();
      expect('__meta' in (like.likeable as object)).toBe(true);
    }

    // Populate again - should handle already-loaded references via __meta branch
    await orm.em.populate(likes, ['likeable']);

    expect(likes.filter(l => l.likeable instanceof Post)).toHaveLength(2);
    expect(likes.filter(l => l.likeable instanceof Comment)).toHaveLength(1);
  });

  test('can query polymorphic relation with $or conditions', async () => {
    // This exercises QueryHelper.liftGroupOperators which skips polymorphic relations
    const post1 = new Post('Post 1', 'Content 1');
    const post2 = new Post('Post 2', 'Content 2');
    const comment1 = new Comment('Comment 1');

    const like1 = new UserLike();
    like1.likeable = post1;
    const like2 = new UserLike();
    like2.likeable = post2;
    const like3 = new UserLike();
    like3.likeable = comment1;

    await orm.em.persist([like1, like2, like3]).flush();
    orm.em.clear();

    // Query with $or on IDs - polymorphic relations should be skipped in liftGroupOperators
    const likes = await orm.em.find(UserLike, {
      $or: [{ id: like1.id }, { id: like2.id }],
    });
    expect(likes).toHaveLength(2);

    // Query all likes for posts (using the discriminator column)
    const postLikes = await orm.em.find(UserLike, {
      likeableType: 'post',
    });
    expect(postLikes).toHaveLength(2);

    // Query with nested condition on polymorphic relation
    // This exercises the polymorphic skip branch in liftGroupOperators (line 103)
    const specificLikes = await orm.em.find(UserLike, {
      likeable: { $or: [{ id: post1.id }, { id: post2.id }] },
    });
    expect(specificLikes).toHaveLength(2);
  });

  test('insert via QueryBuilder with tuple format for simple PK', async () => {
    const post = new Post('Tuple Post', 'Content');
    orm.em.persist(post);
    await orm.em.flush();
    orm.em.clear();

    // Insert using tuple format: ['discriminator', id]
    const qb = orm.em.createQueryBuilder(UserLike);
    await qb.insert({
      likeable: ['post', post.id],
    }).execute();

    orm.em.clear();

    const like = await orm.em.findOneOrFail(UserLike, { likeable: { $ne: null } }, { populate: ['likeable'] });
    expect(like.likeable).toBeInstanceOf(Post);
    expect((like.likeable as Post).title).toBe('Tuple Post');
  });

  test('batch insert with tuple format for simple PK', async () => {
    const post1 = new Post('Batch Post 1', 'Content 1');
    const post2 = new Post('Batch Post 2', 'Content 2');
    const comment1 = new Comment('Batch Comment');
    orm.em.persist([post1, post2, comment1]);
    await orm.em.flush();
    orm.em.clear();

    // Batch insert using tuple format
    await orm.em.insertMany(UserLike, [
      { likeable: ['post', post1.id] },
      { likeable: ['post', post2.id] },
      { likeable: ['comment', comment1.id] },
    ]);

    orm.em.clear();

    const likes = await orm.em.find(UserLike, { likeable: { $ne: null } }, {
      populate: ['likeable'],
      orderBy: { id: 'ASC' },
    });

    expect(likes).toHaveLength(3);
    expect(likes[0].likeable).toBeInstanceOf(Post);
    expect(likes[1].likeable).toBeInstanceOf(Post);
    expect(likes[2].likeable).toBeInstanceOf(Comment);
  });

});

// Test polymorphic with Ref wrapper
import { Reference, ReferenceKind } from '@mikro-orm/core';

@Entity()
class BlogPost {

  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

  constructor(title: string) {
    this.title = title;
  }

}

@Entity()
class Podcast {

  @PrimaryKey()
  id!: number;

  @Property()
  url!: string;

  constructor(url: string) {
    this.url = url;
  }

}

@Entity()
class Bookmark {

  @PrimaryKey()
  id!: number;

  @ManyToOne(() => [BlogPost, Podcast], { ref: true })
  bookmarkable!: Reference<BlogPost | Podcast>;

}

describe('polymorphic relations with Ref wrapper', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [BlogPost, Podcast, Bookmark],
      dbName: ':memory:',
      metadataProvider: ReflectMetadataProvider,
    });
    await orm.schema.create();
  });

  afterAll(() => orm.close(true));

  beforeEach(() => orm.em.clear());

  test('can persist and load polymorphic Ref relation', async () => {
    const blogPost = new BlogPost('Test Article');
    const bookmark = new Bookmark();
    bookmark.bookmarkable = Reference.create(blogPost);

    await orm.em.persist(bookmark).flush();
    orm.em.clear();

    const loadedBookmark = await orm.em.findOneOrFail(Bookmark, bookmark.id);
    expect(loadedBookmark.bookmarkable).toBeInstanceOf(Reference);
    expect(loadedBookmark.bookmarkable.unwrap()).toBeInstanceOf(BlogPost);
  });

  test('can load and populate polymorphic Ref relation', async () => {
    const podcast = new Podcast('https://example.com/podcast');
    const bookmark = new Bookmark();
    bookmark.bookmarkable = Reference.create(podcast);

    await orm.em.persist(bookmark).flush();
    orm.em.clear();

    const loadedBookmark = await orm.em.findOneOrFail(Bookmark, bookmark.id, { populate: ['bookmarkable'] });
    // After populate, the reference is unwrapped to the actual entity
    expect(loadedBookmark.bookmarkable).toBeInstanceOf(Reference);
    const unwrapped = (loadedBookmark.bookmarkable as unknown as Reference<Podcast>).unwrap();
    expect(unwrapped.url).toBe('https://example.com/podcast');
  });

  test('refresh option works with polymorphic Ref relation', async () => {
    const blogPost = new BlogPost('Refresh Test');
    const bookmark = new Bookmark();
    bookmark.bookmarkable = Reference.create(blogPost);

    await orm.em.persist(bookmark).flush();
    orm.em.clear();

    // Load once
    const loadedBookmark = await orm.em.findOneOrFail(Bookmark, bookmark.id, {
      populate: ['bookmarkable'],
    });
    expect(loadedBookmark.bookmarkable).toBeInstanceOf(Reference);
    expect((loadedBookmark.bookmarkable.unwrap() as BlogPost).title).toBe('Refresh Test');

    // Re-load with refresh: true - this triggers the isEntity path in hydrator
    // because the entity already has the relation as an entity reference
    const refreshed = await orm.em.findOneOrFail(Bookmark, bookmark.id, {
      populate: ['bookmarkable'],
      refresh: true,
    });
    expect(refreshed.bookmarkable).toBeInstanceOf(Reference);
    expect((refreshed.bookmarkable.unwrap() as BlogPost).title).toBe('Refresh Test');
  });

  test('batch updates with polymorphic simple keys', async () => {
    const post = orm.em.create(BlogPost, { title: 'Original Post' });
    const podcast = new Podcast('https://example.com/podcast');
    orm.em.persist(podcast);

    const bookmark1 = orm.em.create(Bookmark, { bookmarkable: post });
    const bookmark2 = orm.em.create(Bookmark, { bookmarkable: post });
    const bookmark3 = orm.em.create(Bookmark, { bookmarkable: post });

    await orm.em.flush();
    orm.em.clear();

    // Load all bookmarks and change their bookmarkables
    const bookmarks = await orm.em.find(Bookmark, {}, { orderBy: { id: 'ASC' } });

    // Change bookmarkables to different entities (batch update with simple PKs)
    const loadedPodcast = await orm.em.findOneOrFail(Podcast, { url: 'https://example.com/podcast' });
    bookmarks[0].bookmarkable = Reference.create(loadedPodcast);
    bookmarks[1].bookmarkable = Reference.create(loadedPodcast);

    await orm.em.flush();
    orm.em.clear();

    // Verify updates
    const reloaded = await orm.em.find(Bookmark, {}, {
      populate: ['bookmarkable'],
      orderBy: { id: 'ASC' },
    });

    expect(reloaded[0].bookmarkable.unwrap()).toBeInstanceOf(Podcast);
    expect(reloaded[1].bookmarkable.unwrap()).toBeInstanceOf(Podcast);
    expect(reloaded[2].bookmarkable.unwrap()).toBeInstanceOf(BlogPost);
  });

  test('discriminatorMap with class name strings', async () => {
    @Entity()
    class Article {

      @PrimaryKey()
      id!: number;

      @Property()
      title!: string;

      @OneToMany(() => Rating, r => r.rateable)
      ratings = new Collection<Rating>(this);

    }

    @Entity()
    class Video {

      @PrimaryKey()
      id!: number;

      @Property()
      url!: string;

      @OneToMany(() => Rating, r => r.rateable)
      ratings = new Collection<Rating>(this);

    }

    @Entity()
    class Rating {

      @PrimaryKey()
      id!: number;

      @Property()
      score!: number;

      // Using class names (strings) in discriminatorMap
      @ManyToOne(() => [Article, Video], {
        discriminatorMap: {
          art: Article.name,
          vid: Video.name,
        },
      })
      rateable!: Article | Video;

    }

    const orm2 = await MikroORM.init({
      entities: [Article, Video, Rating],
      dbName: ':memory:',
      metadataProvider: ReflectMetadataProvider,
    });

    await orm2.schema.create();

    const article = new Article();
    article.title = 'Test Article';

    const video = new Video();
    video.url = 'https://example.com/video';

    const rating1 = new Rating();
    rating1.score = 5;
    rating1.rateable = article;

    const rating2 = new Rating();
    rating2.score = 4;
    rating2.rateable = video;

    await orm2.em.persist([rating1, rating2]).flush();
    orm2.em.clear();

    const ratings = await orm2.em.find(Rating, {}, {
      populate: ['rateable'],
      orderBy: { id: 'ASC' },
    });

    expect(ratings).toHaveLength(2);
    expect(ratings[0].rateable).toBeInstanceOf(Article);
    expect(ratings[1].rateable).toBeInstanceOf(Video);

    await orm2.close();
  });

  test('single target union type works as polymorphic', async () => {
    @Entity()
    class SingleTarget {

      @PrimaryKey()
      id!: number;

      @Property()
      name!: string;

    }

    @Entity()
    class Reference {

      @PrimaryKey()
      id!: number;

      // Union type with only one actual target - still works as polymorphic
      @ManyToOne(() => [SingleTarget])
      target!: SingleTarget;

    }

    const orm2 = await MikroORM.init({
      entities: [SingleTarget, Reference],
      dbName: ':memory:',
      metadataProvider: ReflectMetadataProvider,
    });

    // Should be marked as polymorphic even with single target
    const meta = orm2.getMetadata().getByClassName('Reference');
    const prop = meta.properties.target;
    expect(prop.polymorphic).toBe(true);
    expect(prop.polymorphTargets).toHaveLength(1);

    await orm2.close();
  });

  test('throws error for invalid class name in discriminatorMap', async () => {
    @Entity()
    class ValidTarget {

      @PrimaryKey()
      id!: number;

    }

    @Entity()
    class AnotherTarget {

      @PrimaryKey()
      id!: number;

    }

    @Entity()
    class Reference {

      @PrimaryKey()
      id!: number;

      @ManyToOne(() => [ValidTarget, AnotherTarget], {
        discriminatorMap: {
          valid: 'ValidTarget',
          invalid: 'NonExistentEntity', // This class doesn't exist
        },
      })
      target!: ValidTarget | AnotherTarget;

    }

    await expect(MikroORM.init({
      entities: [ValidTarget, AnotherTarget, Reference],
      dbName: ':memory:',
      metadataProvider: ReflectMetadataProvider,
    })).rejects.toThrow(/NonExistentEntity.*was not discovered.*Reference\.target discriminatorMap/);
  });

  test('polymorphic relation with targetKey persists correctly', async () => {
    @Entity()
    class SlugArticle {

      @PrimaryKey()
      id!: number;

      @Property({ unique: true })
      slug!: string;

      @Property()
      title!: string;

    }

    @Entity()
    class SlugVideo {

      @PrimaryKey()
      id!: number;

      @Property({ unique: true })
      slug!: string;

      @Property()
      url!: string;

    }

    @Entity()
    class SlugBookmark {

      @PrimaryKey()
      id!: number;

      @ManyToOne(() => [SlugArticle, SlugVideo], { targetKey: 'slug' })
      bookmarkable!: SlugArticle | SlugVideo;

    }

    const orm2 = await MikroORM.init({
      entities: [SlugArticle, SlugVideo, SlugBookmark],
      dbName: ':memory:',
      metadataProvider: ReflectMetadataProvider,
    });
    await orm2.schema.create();

    // Create target entities
    const article = orm2.em.create(SlugArticle, { slug: 'my-article', title: 'My Article' });
    const video = orm2.em.create(SlugVideo, { slug: 'my-video', url: 'https://example.com/video' });
    await orm2.em.flush();

    // Create bookmarks pointing to each target using targetKey (slug)
    // This exercises ChangeSetComputer line 186: target[prop.targetKey]
    const bookmark1 = orm2.em.create(SlugBookmark, { bookmarkable: article });
    const bookmark2 = orm2.em.create(SlugBookmark, { bookmarkable: video });
    await orm2.em.flush();

    // Verify the FK columns store the slug value (not the PK)
    const connection = orm2.em.getConnection();
    const rows = await connection.execute('SELECT * FROM slug_bookmark ORDER BY id');
    expect(rows[0].bookmarkable_type).toBe('slug_article');
    expect(rows[0].bookmarkable_id).toBe('my-article'); // stores slug value via targetKey
    expect(rows[1].bookmarkable_type).toBe('slug_video');
    expect(rows[1].bookmarkable_id).toBe('my-video'); // stores slug value via targetKey

    await orm2.close(true);
  });

  test('throws on incompatible polymorphic target PK types', async () => {
    @Entity()
    class NumberPKEntity {

      @PrimaryKey()
      id!: number;

    }

    @Entity()
    class StringPKEntity {

      @PrimaryKey()
      id!: string;

    }

    @Entity()
    class IncompatibleRef {

      @PrimaryKey()
      id!: number;

      @ManyToOne(() => [NumberPKEntity, StringPKEntity])
      target!: NumberPKEntity | StringPKEntity;

    }

    await expect(MikroORM.init({
      entities: [NumberPKEntity, StringPKEntity, IncompatibleRef],
      dbName: ':memory:',
      metadataProvider: ReflectMetadataProvider,
    })).rejects.toThrow(/incompatible polymorphic targets.*incompatible primary key types/);
  });

  test('throws on incompatible polymorphic target PK count', async () => {
    @Entity()
    class SimplePKEntity {

      @PrimaryKey()
      id!: number;

    }

    @Entity()
    class CompositePKEntity {

      @PrimaryKey()
      id1!: number;

      @PrimaryKey()
      id2!: number;

    }

    @Entity()
    class IncompatibleRef {

      @PrimaryKey()
      id!: number;

      @ManyToOne(() => [SimplePKEntity, CompositePKEntity])
      target!: SimplePKEntity | CompositePKEntity;

    }

    await expect(MikroORM.init({
      entities: [SimplePKEntity, CompositePKEntity, IncompatibleRef],
      dbName: ':memory:',
      metadataProvider: ReflectMetadataProvider,
    })).rejects.toThrow(/incompatible polymorphic targets.*different number of primary keys/);
  });

  test('throws when targetKey is missing on polymorphic target', async () => {
    @Entity()
    class EntityWithSlug {

      @PrimaryKey()
      id!: number;

      @Property({ unique: true })
      slug!: string;

    }

    @Entity()
    class EntityWithoutSlug {

      @PrimaryKey()
      id!: number;

    }

    @Entity()
    class RefWithTargetKey {

      @PrimaryKey()
      id!: number;

      @ManyToOne(() => [EntityWithSlug, EntityWithoutSlug], { targetKey: 'slug' })
      target!: EntityWithSlug | EntityWithoutSlug;

    }

    await expect(MikroORM.init({
      entities: [EntityWithSlug, EntityWithoutSlug, RefWithTargetKey],
      dbName: ':memory:',
      metadataProvider: ReflectMetadataProvider,
    })).rejects.toThrow(/targetKey.*slug.*EntityWithoutSlug\.slug does not exist/);
  });

  test('throws when targetKey is not unique on polymorphic target', async () => {
    @Entity()
    class EntityWithUniqueSlug {

      @PrimaryKey()
      id!: number;

      @Property({ unique: true })
      slug!: string;

    }

    @Entity()
    class EntityWithNonUniqueSlug {

      @PrimaryKey()
      id!: number;

      @Property()
      slug!: string;

    }

    @Entity()
    class RefWithTargetKey {

      @PrimaryKey()
      id!: number;

      @ManyToOne(() => [EntityWithUniqueSlug, EntityWithNonUniqueSlug], { targetKey: 'slug' })
      target!: EntityWithUniqueSlug | EntityWithNonUniqueSlug;

    }

    await expect(MikroORM.init({
      entities: [EntityWithUniqueSlug, EntityWithNonUniqueSlug, RefWithTargetKey],
      dbName: ':memory:',
      metadataProvider: ReflectMetadataProvider,
    })).rejects.toThrow(/targetKey.*slug.*EntityWithNonUniqueSlug\.slug is not marked as unique/);
  });

  test('schema is up-to-date for polymorphic relations', async () => {
    const sql = await orm.schema.getUpdateSchemaSQL();
    expect(sql).toBe('');
  });

});

// Test polymorphic with @OneToOne
import { OneToOne } from '@mikro-orm/decorators/legacy';

@Entity()
class User {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  constructor(name: string) {
    this.name = name;
  }

}

@Entity()
class Organization {

  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

  constructor(title: string) {
    this.title = title;
  }

}

@Entity()
class Profile {

  @PrimaryKey()
  id!: number;

  @Property()
  bio!: string;

  @OneToOne(() => [User, Organization], { nullable: true, owner: true })
  owner!: User | Organization | null;

  constructor(bio: string) {
    this.bio = bio;
  }

}

describe('polymorphic @OneToOne relations', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [User, Organization, Profile],
      dbName: ':memory:',
      metadataProvider: ReflectMetadataProvider,
    });
    await orm.schema.create();
  });

  afterAll(() => orm.close(true));

  beforeEach(async () => {
    await orm.em.nativeDelete(Profile, {});
    await orm.em.nativeDelete(User, {});
    await orm.em.nativeDelete(Organization, {});
    orm.em.clear();
  });

  test('metadata is correctly initialized for polymorphic OneToOne', () => {
    const meta = orm.getMetadata().get(Profile);
    const ownerProp = meta.properties.owner;

    expect(ownerProp.polymorphic).toBe(true);
    expect(ownerProp.polymorphTargets).toHaveLength(2);
    expect(ownerProp.discriminator).toBe('owner');
    expect(ownerProp.discriminatorMap).toBeDefined();
    expect(ownerProp.kind).toBe(ReferenceKind.ONE_TO_ONE);
    expect(ownerProp.createForeignKeyConstraint).toBe(false);
  });

  test('can persist and load polymorphic OneToOne pointing to User', async () => {
    const user = new User('Alice');
    const profile = new Profile('Alice bio');
    profile.owner = user;

    orm.em.persist(profile);
    await orm.em.flush();
    orm.em.clear();

    const loaded = await orm.em.findOneOrFail(Profile, profile.id);
    expect(loaded.owner).toBeDefined();
    expect(loaded.owner!.constructor.name).toBe('User');
  });

  test('can persist and load polymorphic OneToOne pointing to Organization', async () => {
    const org = new Organization('Acme Corp');
    const profile = new Profile('Org bio');
    profile.owner = org;

    orm.em.persist(profile);
    await orm.em.flush();
    orm.em.clear();

    const loaded = await orm.em.findOneOrFail(Profile, profile.id);
    expect(loaded.owner).toBeDefined();
    expect(loaded.owner!.constructor.name).toBe('Organization');
  });

  test('can populate polymorphic OneToOne', async () => {
    const user = new User('Bob');
    const org = new Organization('Corp Inc');

    const profile1 = new Profile('Bob bio');
    profile1.owner = user;
    const profile2 = new Profile('Corp bio');
    profile2.owner = org;

    orm.em.persist([profile1, profile2]);
    await orm.em.flush();
    orm.em.clear();

    const profiles = await orm.em.find(Profile, {}, {
      populate: ['owner'],
      orderBy: { id: 'ASC' },
    });

    expect(profiles).toHaveLength(2);
    expect(profiles[0].owner).toBeInstanceOf(User);
    expect((profiles[0].owner as User).name).toBe('Bob');
    expect(profiles[1].owner).toBeInstanceOf(Organization);
    expect((profiles[1].owner as Organization).title).toBe('Corp Inc');
  });

  test('can handle null polymorphic OneToOne', async () => {
    const connection = orm.em.getConnection();
    await connection.execute("INSERT INTO profile (id, bio, owner_type, owner_id) VALUES (1, 'No owner', NULL, NULL)");
    orm.em.clear();

    const loaded = await orm.em.findOneOrFail(Profile, 1);
    expect(loaded.owner).toBeNull();
  });

  test('can handle null polymorphic OneToOne with joined loading', async () => {
    const connection = orm.em.getConnection();
    await connection.execute("INSERT INTO profile (id, bio, owner_type, owner_id) VALUES (1, 'No owner', NULL, NULL)");
    orm.em.clear();

    const loaded = await orm.em.findOneOrFail(Profile, 1, {
      populate: ['owner'],
      strategy: 'joined',
    });
    expect(loaded.owner).toBeNull();
  });

  test('schema is up-to-date for polymorphic OneToOne', async () => {
    const sql = await orm.schema.getUpdateSchemaSQL();
    expect(sql).toBe('');
  });

});
