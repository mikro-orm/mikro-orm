import { Collection, helper, LoadStrategy, MikroORM, Ref, ref, wrap } from '@mikro-orm/sqlite';
import {
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryKey,
  Property,
  ReflectMetadataProvider,
} from '@mikro-orm/decorators/legacy';

@Entity()
class Author {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @OneToMany(() => Article, a => a.author)
  articles = new Collection<Article>(this);
}

@Entity()
class Article {
  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

  @ManyToOne(() => Author)
  author!: Author;

  @OneToMany(() => Reaction, r => r.target)
  reactions = new Collection<Reaction>(this);
}

@Entity()
class Video {
  @PrimaryKey()
  id!: number;

  @Property()
  url!: string;

  @ManyToOne(() => Author)
  author!: Author;

  @OneToMany(() => Reaction, r => r.target)
  reactions = new Collection<Reaction>(this);
}

@Entity()
class Reaction {
  @PrimaryKey()
  id!: number;

  @Property()
  emoji!: string;

  @ManyToOne(() => [Article, Video])
  target!: Article | Video;

  @ManyToOne(() => Author)
  reactor!: Author;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: ':memory:',
    entities: [Author, Article, Video, Reaction],
  });
  await orm.schema.create();

  const author1 = orm.em.create(Author, { name: 'Alice' });
  const author2 = orm.em.create(Author, { name: 'Bob' });

  const article1 = orm.em.create(Article, { title: 'Article 1', author: author1 });
  const article2 = orm.em.create(Article, { title: 'Article 2', author: author1 });
  const video1 = orm.em.create(Video, { url: 'https://example.com/video1', author: author2 });
  const video2 = orm.em.create(Video, { url: 'https://example.com/video2', author: author2 });

  orm.em.create(Reaction, { emoji: '👍', target: article1, reactor: author2 });
  orm.em.create(Reaction, { emoji: '❤️', target: article1, reactor: author2 });
  orm.em.create(Reaction, { emoji: '🎉', target: article2, reactor: author2 });
  orm.em.create(Reaction, { emoji: '👍', target: video1, reactor: author1 });
  orm.em.create(Reaction, { emoji: '😂', target: video2, reactor: author1 });

  await orm.em.flush();
  orm.em.clear();
});

afterAll(() => orm.close(true));

describe.each(Object.values(LoadStrategy))('polymorphic relations with %s strategy', strategy => {
  beforeEach(() => orm.em.clear());

  test('loads polymorphic relation', async () => {
    const reactions = await orm.em.find(
      Reaction,
      {},
      {
        populate: ['target'],
        strategy,
      },
    );

    expect(reactions).toHaveLength(5);
    const articleReactions = reactions.filter(r => r.target instanceof Article);
    const videoReactions = reactions.filter(r => r.target instanceof Video);
    expect(articleReactions).toHaveLength(3);
    expect(videoReactions).toHaveLength(2);
  });

  test('loads polymorphic relation alongside regular relation', async () => {
    const reactions = await orm.em.find(
      Reaction,
      {},
      {
        populate: ['target', 'reactor'],
        strategy,
      },
    );

    expect(reactions).toHaveLength(5);
    for (const reaction of reactions) {
      expect(reaction.target).toBeDefined();
      expect(reaction.reactor).toBeDefined();
      expect(['Alice', 'Bob']).toContain(reaction.reactor.name);
    }
  });

  test('loads nested relation through polymorphic relation', async () => {
    const reactions = await orm.em.find(
      Reaction,
      {},
      {
        populate: ['target.author'],
        strategy,
      },
    );

    expect(reactions).toHaveLength(5);
    for (const reaction of reactions) {
      expect(reaction.target).toBeDefined();
      if (reaction.target instanceof Article) {
        expect(reaction.target.author.name).toBe('Alice');
      } else {
        expect(reaction.target.author.name).toBe('Bob');
      }
    }
  });
});

describe.each(Object.values(LoadStrategy))('polymorphic inverse side with %s strategy', strategy => {
  beforeEach(() => orm.em.clear());

  test('loads inverse side of polymorphic relation', async () => {
    const articles = await orm.em.find(
      Article,
      {},
      {
        populate: ['reactions'],
        strategy,
      },
    );

    expect(articles).toHaveLength(2);
    expect(articles.find(a => a.title === 'Article 1')!.reactions).toHaveLength(2);
    expect(articles.find(a => a.title === 'Article 2')!.reactions).toHaveLength(1);
  });

  test('loads inverse side with nested populate', async () => {
    const articles = await orm.em.find(
      Article,
      {},
      {
        populate: ['reactions.reactor'],
        strategy,
      },
    );

    expect(articles).toHaveLength(2);
    for (const article of articles) {
      for (const reaction of article.reactions) {
        expect(reaction.reactor.name).toBe('Bob');
      }
    }
  });

  test('loads complex graph: author -> articles -> reactions -> reactor', async () => {
    const authors = await orm.em.find(
      Author,
      { name: 'Alice' },
      {
        populate: ['articles.reactions.reactor'],
        strategy,
      },
    );

    expect(authors).toHaveLength(1);
    const alice = authors[0];
    expect(alice.articles).toHaveLength(2);

    const article1 = alice.articles.find(a => a.title === 'Article 1')!;
    expect(article1.reactions).toHaveLength(2);
    for (const reaction of article1.reactions) {
      expect(reaction.reactor.name).toBe('Bob');
    }
  });
});

// Test Ref wrapper on polymorphic relations
describe('polymorphic relations with Ref wrapper', () => {
  @Entity()
  class Post {
    @PrimaryKey()
    id!: number;

    @Property()
    title!: string;
  }

  @Entity()
  class Image {
    @PrimaryKey()
    id!: number;

    @Property()
    url!: string;
  }

  @Entity()
  class Comment {
    @PrimaryKey()
    id!: number;

    @Property()
    text!: string;

    @ManyToOne(() => [Post, Image], { ref: true })
    target!: Ref<Post> | Ref<Image>;
  }

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      dbName: ':memory:',
      entities: [Post, Image, Comment],
    });
    await orm.schema.create();
  });

  afterAll(() => orm.close(true));

  beforeEach(() => orm.em.clear());

  test('creates entity with Ref-wrapped polymorphic relation', async () => {
    const post = orm.em.create(Post, { title: 'Test Post' });
    const image = orm.em.create(Image, { url: 'https://example.com/image.png' });
    const comment1 = orm.em.create(Comment, { text: 'Nice post!', target: ref(post) });
    const comment2 = orm.em.create(Comment, { text: 'Nice image!', target: ref(image) });

    await orm.em.flush();
    orm.em.clear();

    const comments = await orm.em.find(Comment, {}, { populate: ['target'] });
    expect(comments).toHaveLength(2);

    const postComment = comments.find(c => c.text === 'Nice post!')!;
    const imageComment = comments.find(c => c.text === 'Nice image!')!;

    expect(postComment.target.unwrap()).toBeInstanceOf(Post);
    expect(imageComment.target.unwrap()).toBeInstanceOf(Image);
    expect((postComment.target.unwrap() as Post).title).toBe('Test Post');
    expect((imageComment.target.unwrap() as Image).url).toBe('https://example.com/image.png');
  });

  test('loads Ref-wrapped polymorphic relation without populate', async () => {
    const post = orm.em.create(Post, { title: 'Another Post' });
    orm.em.create(Comment, { text: 'Comment on post', target: ref(post) });

    await orm.em.flush();
    orm.em.clear();

    const comment = await orm.em.findOneOrFail(Comment, { text: 'Comment on post' });

    // Without populate, target should be a reference (not loaded)
    expect(comment.target.isInitialized()).toBe(false);
    expect(comment.target.id).toBeDefined();
  });

  test.each(Object.values(LoadStrategy))('loads Ref-wrapped polymorphic relation with %s strategy', async strategy => {
    orm.em.clear();
    const image = orm.em.create(Image, { url: 'https://example.com/test.png' });
    orm.em.create(Comment, { text: 'Test comment', target: ref(image) });

    await orm.em.flush();
    orm.em.clear();

    const comment = await orm.em.findOneOrFail(
      Comment,
      { text: 'Test comment' },
      {
        populate: ['target'],
        strategy,
      },
    );

    expect(comment.target.isInitialized()).toBe(true);
    expect(comment.target.unwrap()).toBeInstanceOf(Image);
    expect((comment.target.unwrap() as Image).url).toBe('https://example.com/test.png');
  });

  test('assigns entity directly to Ref-wrapped polymorphic relation', async () => {
    const post = orm.em.create(Post, { title: 'Direct assign post' });
    const comment = orm.em.create(Comment, { text: 'Direct assign comment', target: post });

    await orm.em.flush();
    orm.em.clear();

    const loaded = await orm.em.findOneOrFail(Comment, { text: 'Direct assign comment' }, { populate: ['target'] });
    expect(loaded.target.unwrap()).toBeInstanceOf(Post);
    expect((loaded.target.unwrap() as Post).title).toBe('Direct assign post');
  });
});

describe('lazy loading polymorphic relations', () => {
  beforeEach(() => orm.em.clear());

  test('polymorphic relation is a reference when not populated', async () => {
    const reaction = await orm.em.findOneOrFail(Reaction, { emoji: '👍' });

    // Should have a reference with the correct type, but not initialized
    expect(reaction.target).toBeDefined();
    expect(reaction.target).toBeInstanceOf(Article);
    expect(wrap(reaction.target).isInitialized()).toBe(false);
    expect(helper(reaction.target).hasPrimaryKey()).toBe(true);

    // The reference should only have PK, not other properties
    const article = reaction.target as Article;
    expect(article.id).toBeDefined();
    expect(article.title).toBeUndefined(); // Not loaded yet
  });

  test('lazy loads polymorphic relation via em.populate', async () => {
    const reaction = await orm.em.findOneOrFail(Reaction, { emoji: '👍' });

    // Should be a reference, not initialized
    expect(wrap(reaction.target).isInitialized()).toBe(false);

    await orm.em.populate(reaction, ['target']);

    // Now should be initialized
    expect(wrap(reaction.target).isInitialized()).toBe(true);
    expect(reaction.target).toBeInstanceOf(Article);
    expect((reaction.target as Article).title).toBe('Article 1');
  });

  test('skips already-initialized polymorphic relation without refresh', async () => {
    // Load reaction with populated target
    const reaction = await orm.em.findOneOrFail(
      Reaction,
      { emoji: '👍' },
      {
        populate: ['target'],
      },
    );

    // Target should be initialized
    expect(wrap(reaction.target).isInitialized()).toBe(true);
    expect((reaction.target as Article).title).toBe('Article 1');

    // Populate again without refresh - should be a no-op (covers line 275 in EntityLoader.ts)
    await orm.em.populate(reaction, ['target']);

    // Still initialized with same data
    expect(wrap(reaction.target).isInitialized()).toBe(true);
    expect((reaction.target as Article).title).toBe('Article 1');
  });

  test('lazy loads multiple polymorphic relations via em.populate', async () => {
    const reactions = await orm.em.find(Reaction, {});

    // All targets should be references (not initialized)
    for (const reaction of reactions) {
      expect(reaction.target).toBeDefined();
      expect(wrap(reaction.target).isInitialized()).toBe(false);
    }

    // Populate should load all
    await orm.em.populate(reactions, ['target']);

    for (const reaction of reactions) {
      expect(wrap(reaction.target).isInitialized()).toBe(true);
    }

    const articleReactions = reactions.filter(r => r.target instanceof Article);
    const videoReactions = reactions.filter(r => r.target instanceof Video);
    expect(articleReactions).toHaveLength(3);
    expect(videoReactions).toHaveLength(2);
  });

  test('lazy loads second polymorphic target type (Video) via em.populate', async () => {
    // Load only reaction pointing to Video (second target type)
    const reaction = await orm.em.findOneOrFail(Reaction, { emoji: '😂' });

    expect(reaction.target).toBeInstanceOf(Video);
    expect(wrap(reaction.target).isInitialized()).toBe(false);

    await orm.em.populate(reaction, ['target']);

    expect(wrap(reaction.target).isInitialized()).toBe(true);
    expect((reaction.target as Video).url).toBe('https://example.com/video2');
  });

  test('lazy loads nested relation through second polymorphic target type', async () => {
    const reaction = await orm.em.findOneOrFail(Reaction, { emoji: '😂' });

    expect(reaction.target).toBeInstanceOf(Video);
    expect(wrap(reaction.target).isInitialized()).toBe(false);

    await orm.em.populate(reaction, ['target.author']);

    expect(wrap(reaction.target).isInitialized()).toBe(true);
    expect((reaction.target as Video).author).toBeDefined();
    expect((reaction.target as Video).author.name).toBe('Bob');
  });

  test('lazy loads Ref-wrapped polymorphic relation via ref.load()', async () => {
    @Entity()
    class LazyPost {
      @PrimaryKey()
      id!: number;

      @Property()
      title!: string;
    }

    @Entity()
    class LazyImage {
      @PrimaryKey()
      id!: number;

      @Property()
      url!: string;
    }

    @Entity()
    class LazyComment {
      @PrimaryKey()
      id!: number;

      @Property()
      text!: string;

      @ManyToOne(() => [LazyPost, LazyImage], { ref: true })
      target!: Ref<LazyPost> | Ref<LazyImage>;
    }

    const localOrm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      dbName: ':memory:',
      entities: [LazyPost, LazyImage, LazyComment],
    });
    await localOrm.schema.create();

    const post = localOrm.em.create(LazyPost, { title: 'Lazy load post' });
    localOrm.em.create(LazyComment, { text: 'Lazy load comment', target: ref(post) });
    await localOrm.em.flush();
    localOrm.em.clear();

    // Polymorphic relations are auto-loaded, but ref.load() should still work
    const comment = await localOrm.em.findOneOrFail(LazyComment, { text: 'Lazy load comment' });

    const loaded = await (comment.target as Ref<LazyPost>).load();
    expect(comment.target.isInitialized()).toBe(true);
    expect(loaded).toBeInstanceOf(LazyPost);
    expect(loaded!.title).toBe('Lazy load post');

    await localOrm.close(true);
  });

  test('lazy loads inverse side collection via collection.init()', async () => {
    // Load article without populating reactions
    const article = await orm.em.findOneOrFail(Article, { title: 'Article 1' });

    // Collection should not be initialized
    expect(article.reactions.isInitialized()).toBe(false);

    // Lazy load the collection
    await article.reactions.init();

    expect(article.reactions.isInitialized()).toBe(true);
    expect(article.reactions).toHaveLength(2);
    expect(
      article.reactions
        .getItems()
        .map(r => r.emoji)
        .sort(),
    ).toEqual(['❤️', '👍']);
  });

  test('lazy loads nested relations through polymorphic relation via em.populate', async () => {
    const reaction = await orm.em.findOneOrFail(Reaction, { emoji: '👍' });

    // Polymorphic target is a reference (not initialized)
    expect(reaction.target).toBeInstanceOf(Article);
    expect(wrap(reaction.target).isInitialized()).toBe(false);

    // Populate the nested author relation through the polymorphic relation
    await orm.em.populate(reaction, ['target.author']);

    // Now target should be initialized
    expect(wrap(reaction.target).isInitialized()).toBe(true);

    // And author should be populated
    const article = reaction.target as Article;
    expect(article.author).toBeDefined();
    expect(wrap(article.author).isInitialized()).toBe(true);
    expect(article.author.name).toBe('Alice');
  });
});

describe(':ref populate hints for polymorphic relations', () => {
  beforeEach(() => orm.em.clear());

  test('polymorphic to-one with :ref hint is a no-op (already has FK and discriminator)', async () => {
    // For polymorphic to-one relations, :ref should be a no-op since we already
    // have the FK and discriminator columns in the row - no additional query needed
    const reaction = await orm.em.findOneOrFail(
      Reaction,
      { emoji: '👍' },
      {
        populate: ['target:ref'],
      },
    );

    expect(reaction.target).toBeInstanceOf(Article);
    // :ref should NOT load the entity - we already have a reference from the FK columns
    expect(wrap(reaction.target).isInitialized()).toBe(false);
    expect(helper(reaction.target).hasPrimaryKey()).toBe(true);
    expect((reaction.target as Article).id).toBeDefined();
    expect((reaction.target as Article).title).toBeUndefined(); // Not loaded
  });

  test('polymorphic to-one without populate is already a reference', async () => {
    // This test confirms that without populate, we already get a reference
    const reaction = await orm.em.findOneOrFail(Reaction, { emoji: '👍' });

    expect(reaction.target).toBeInstanceOf(Article);
    expect(wrap(reaction.target).isInitialized()).toBe(false);
    expect(helper(reaction.target).hasPrimaryKey()).toBe(true);
    expect((reaction.target as Article).id).toBeDefined();
    expect((reaction.target as Article).title).toBeUndefined();
  });

  test('inverse polymorphic collection with :ref hint populates with references', async () => {
    // For to-many inverse side, :ref should populate the collection with entity references
    // that have PKs but are not fully loaded
    const article = await orm.em.findOneOrFail(
      Article,
      { title: 'Article 1' },
      {
        populate: ['reactions:ref'],
      },
    );

    // Collection should be initialized (we know which items belong to it)
    expect(article.reactions.isInitialized()).toBe(true);
    expect(article.reactions).toHaveLength(2);

    // But each item should be a reference (not fully loaded)
    for (const reaction of article.reactions) {
      expect(reaction.id).toBeDefined();
      expect(wrap(reaction).isInitialized()).toBe(false);
      expect(reaction.emoji).toBeUndefined(); // Not loaded yet
    }
  });

  test('inverse polymorphic collection :ref can be fully loaded afterward', async () => {
    const article = await orm.em.findOneOrFail(
      Article,
      { title: 'Article 1' },
      {
        populate: ['reactions:ref'],
      },
    );

    // Collection has references
    expect(article.reactions.isInitialized()).toBe(true);
    expect(article.reactions).toHaveLength(2);
    expect(wrap(article.reactions[0]).isInitialized()).toBe(false);

    // Now fully populate the reactions
    await orm.em.populate(article, ['reactions']);

    // Now each reaction should be fully loaded
    for (const reaction of article.reactions) {
      expect(wrap(reaction).isInitialized()).toBe(true);
      expect(reaction.emoji).toBeDefined();
    }
    expect(
      article.reactions
        .getItems()
        .map(r => r.emoji)
        .sort(),
    ).toEqual(['❤️', '👍']);
  });

  test('polymorphic to-one with :ref and partial loading (FK excluded) loads only FK', async () => {
    // Load reaction without the polymorphic FK columns (partial loading)
    const reaction = await orm.em.findOneOrFail(
      Reaction,
      { emoji: '👍' },
      {
        fields: ['id', 'emoji'], // Exclude target FK columns
      },
    );

    // Target should be undefined since FK was not loaded
    expect((reaction as Reaction).target).toBeUndefined();

    // Now populate with :ref - should load only the FK columns, not the full target
    await orm.em.populate(reaction, ['target:ref']);

    // Target should now be a reference (not initialized) with PK set
    expect((reaction as Reaction).target).toBeInstanceOf(Article);
    expect(wrap((reaction as Reaction).target).isInitialized()).toBe(false);
    expect(helper((reaction as Reaction).target).hasPrimaryKey()).toBe(true);
    expect(((reaction as Reaction).target as Article).id).toBeDefined();
    expect(((reaction as Reaction).target as Article).title).toBeUndefined(); // Not loaded
  });

  test('polymorphic to-one without :ref and partial loading loads full target', async () => {
    // Load reaction without the polymorphic FK columns (partial loading)
    const reaction = await orm.em.findOneOrFail(
      Reaction,
      { emoji: '❤️' },
      {
        fields: ['id', 'emoji'], // Exclude target FK columns
      },
    );

    // Target should be undefined since FK was not loaded
    expect((reaction as Reaction).target).toBeUndefined();

    // Now populate without :ref - should load the full target entity
    await orm.em.populate(reaction, ['target']);

    // Target should be fully initialized
    expect((reaction as Reaction).target).toBeInstanceOf(Article);
    expect(wrap((reaction as Reaction).target).isInitialized()).toBe(true);
    expect(((reaction as Reaction).target as Article).title).toBe('Article 1');
  });
});

// Test for nullable polymorphic relation in nested joined loading
// This exercises mapJoinedProps code path for polymorphic relations
describe('nullable polymorphic relation in nested joined loading', () => {
  @Entity()
  class TargetA {
    @PrimaryKey()
    id!: number;

    @Property()
    name!: string;
  }

  @Entity()
  class TargetB {
    @PrimaryKey()
    id!: number;

    @Property()
    label!: string;
  }

  @Entity()
  class ChildEntity {
    @PrimaryKey()
    id!: number;

    @Property()
    title!: string;

    @ManyToOne(() => [TargetA, TargetB], { nullable: true })
    ref!: TargetA | TargetB | null;
  }

  @Entity()
  class ParentEntity {
    @PrimaryKey()
    id!: number;

    @Property()
    name!: string;

    @ManyToOne(() => ChildEntity)
    child!: ChildEntity;
  }

  let orm2: MikroORM;

  beforeAll(async () => {
    orm2 = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      dbName: ':memory:',
      entities: [TargetA, TargetB, ChildEntity, ParentEntity],
    });
    await orm2.schema.create();

    const targetA = orm2.em.create(TargetA, { name: 'Target A' });
    const child1 = orm2.em.create(ChildEntity, { title: 'Child with ref', ref: targetA });
    const child2 = orm2.em.create(ChildEntity, { title: 'Child without ref', ref: null });
    orm2.em.create(ParentEntity, { name: 'Parent 1', child: child1 });
    orm2.em.create(ParentEntity, { name: 'Parent 2', child: child2 });

    await orm2.em.flush();
    orm2.em.clear();
  });

  afterAll(() => orm2.close(true));

  test('joined loading with null polymorphic relation in nested entity', async () => {
    const parents = await orm2.em.find(
      ParentEntity,
      {},
      {
        populate: ['child'],
        strategy: LoadStrategy.JOINED,
        orderBy: { id: 'ASC' },
      },
    );

    expect(parents).toHaveLength(2);
    expect(parents[0].child.title).toBe('Child with ref');
    expect(parents[0].child.ref).toBeInstanceOf(TargetA);
    expect(parents[1].child.title).toBe('Child without ref');
    expect(parents[1].child.ref).toBeNull();
  });
});
