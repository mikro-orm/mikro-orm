import { Collection, MikroORM } from '@mikro-orm/sqlite';
import {
  Entity,
  ManyToMany,
  PrimaryKey,
  Property,
  ReflectMetadataProvider,
} from '@mikro-orm/decorators/legacy';

@Entity()
class Tag {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  // Inverse sides - separate collections per entity type
  @ManyToMany(() => Post, post => post.tags)
  posts = new Collection<Post>(this);

  @ManyToMany(() => Video, video => video.tags)
  videos = new Collection<Video>(this);

  constructor(name: string) {
    this.name = name;
  }

}

@Entity()
class Post {

  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

  // Owner side - polymorphic M:N to Tag via shared pivot table
  @ManyToMany(() => Tag, tag => tag.posts, {
    pivotTable: 'taggables',
    discriminator: 'taggable',  // Column in pivot table storing 'post' or 'video'
    owner: true,
  })
  tags = new Collection<Tag>(this);

  constructor(title: string) {
    this.title = title;
  }

}

@Entity()
class Video {

  @PrimaryKey()
  id!: number;

  @Property()
  url!: string;

  // Owner side - polymorphic M:N to Tag via same shared pivot table
  @ManyToMany(() => Tag, tag => tag.videos, {
    pivotTable: 'taggables',
    discriminator: 'taggable',  // Same discriminator column
    owner: true,
  })
  tags = new Collection<Tag>(this);

  constructor(url: string) {
    this.url = url;
  }

}

describe('polymorphic many-to-many relations', () => {

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Tag, Post, Video],
      dbName: ':memory:',
      metadataProvider: ReflectMetadataProvider,
    });
    await orm.schema.create();
  });

  afterAll(async () => {
    await orm.close(true);
  });

  beforeEach(async () => {
    await orm.schema.clear();
    orm.em.clear();
  });

  test('metadata is correctly initialized for polymorphic M:N relation', async () => {
    const postMeta = orm.getMetadata().get(Post);
    const tagsProp = postMeta.properties.tags;

    expect(tagsProp.pivotTable).toBe('taggables');
    expect(tagsProp.discriminatorColumn).toBe('taggable_type');
  });

  test('schema creates shared pivot table with discriminator column', async () => {
    const sql = await orm.schema.getCreateSchemaSQL();

    expect(sql).toContain('taggables');
    expect(sql).toContain('taggable_type');
    expect(sql).toContain('taggable_id');
    expect(sql).toContain('tag_id');
  });

  test('can add tags to Post and Video using same pivot table', async () => {
    const tag1 = new Tag('TypeScript');
    const tag2 = new Tag('Testing');
    const post = new Post('MikroORM Guide');
    const video = new Video('https://example.com/video.mp4');

    post.tags.add(tag1, tag2);
    video.tags.add(tag1);

    await orm.em.persist([post, video]).flush();
    orm.em.clear();

    const pivotData = await orm.em.execute('SELECT * FROM taggables ORDER BY taggable_type, tag_id');
    expect(pivotData).toHaveLength(3);

    const postEntries = pivotData.filter((r: any) => r.taggable_type === 'post');
    const videoEntries = pivotData.filter((r: any) => r.taggable_type === 'video');

    expect(postEntries).toHaveLength(2);
    expect(videoEntries).toHaveLength(1);
  });

  test('can load tags for Post and Video independently', async () => {
    const tag1 = new Tag('TypeScript');
    const tag2 = new Tag('Testing');
    const post = new Post('MikroORM Guide');
    const video = new Video('https://example.com/video.mp4');

    post.tags.add(tag1, tag2);
    video.tags.add(tag1);

    await orm.em.persist([post, video]).flush();
    orm.em.clear();

    const loadedPost = await orm.em.findOneOrFail(Post, { id: post.id }, { populate: ['tags'] });
    expect(loadedPost.tags).toHaveLength(2);
    expect(loadedPost.tags.getItems().map(t => t.name).sort()).toEqual(['Testing', 'TypeScript']);

    orm.em.clear();

    const loadedVideo = await orm.em.findOneOrFail(Video, { id: video.id }, { populate: ['tags'] });
    expect(loadedVideo.tags).toHaveLength(1);
    expect(loadedVideo.tags.getItems()[0].name).toBe('TypeScript');
  });

  test('inverse side returns correct entities per type', async () => {
    const tag = new Tag('Shared Tag');
    const post1 = new Post('Post 1');
    const post2 = new Post('Post 2');
    const video = new Video('https://example.com/video.mp4');

    post1.tags.add(tag);
    post2.tags.add(tag);
    video.tags.add(tag);

    await orm.em.persist([post1, post2, video]).flush();
    orm.em.clear();

    const loadedTag = await orm.em.findOneOrFail(Tag, { id: tag.id }, { populate: ['posts', 'videos'] });

    expect(loadedTag.posts).toHaveLength(2);
    expect(loadedTag.videos).toHaveLength(1);
    expect(loadedTag.posts.getItems().map(p => p.title).sort()).toEqual(['Post 1', 'Post 2']);
    expect(loadedTag.videos.getItems()[0].url).toBe('https://example.com/video.mp4');
  });

  test('can remove tags from polymorphic collection', async () => {
    const tag1 = new Tag('TypeScript');
    const tag2 = new Tag('Testing');
    const post = new Post('MikroORM Guide');

    post.tags.add(tag1, tag2);
    await orm.em.persist(post).flush();

    post.tags.remove(tag1);
    await orm.em.flush();
    orm.em.clear();

    const loadedPost = await orm.em.findOneOrFail(Post, { id: post.id }, { populate: ['tags'] });
    expect(loadedPost.tags).toHaveLength(1);
    expect(loadedPost.tags.getItems()[0].name).toBe('Testing');
  });

  test('can clear all tags from polymorphic collection', async () => {
    const tag1 = new Tag('Tag1');
    const tag2 = new Tag('Tag2');
    const post = new Post('Post with tags');

    post.tags.add(tag1, tag2);
    await orm.em.persist(post).flush();

    post.tags.removeAll();
    await orm.em.flush();
    orm.em.clear();

    const loadedPost = await orm.em.findOneOrFail(Post, { id: post.id }, { populate: ['tags'] });
    expect(loadedPost.tags).toHaveLength(0);

    const pivotData = await orm.em.execute('SELECT * FROM taggables WHERE taggable_type = ? AND taggable_id = ?', ['post', post.id]);
    expect(pivotData).toHaveLength(0);
  });

  test('can load M:N with where condition on target', async () => {
    const tag1 = new Tag('TypeScript');
    const tag2 = new Tag('JavaScript');
    const post = new Post('Programming');
    post.tags.add(tag1, tag2);

    await orm.em.persist(post).flush();
    orm.em.clear();

    const loadedPost = await orm.em.findOneOrFail(Post, post.id, {
      populate: ['tags'],
      populateWhere: { tags: { name: 'TypeScript' } },
    });

    expect(loadedPost.tags.length).toBeGreaterThanOrEqual(1);
  });

  test('can load M:N with fields option', async () => {
    const tag = new Tag('Testing');
    const post = new Post('Test Post');
    post.tags.add(tag);

    await orm.em.persist(post).flush();
    orm.em.clear();

    const loadedPost = await orm.em.findOneOrFail(Post, post.id, {
      populate: ['tags'],
      fields: ['title', 'tags.name'],
    });

    expect(loadedPost.tags).toHaveLength(1);
    expect(loadedPost.tags[0].name).toBe('Testing');
  });

  test('loads multiple owners with composite batch', async () => {
    const tag = new Tag('Shared');
    const post1 = new Post('Post 1');
    const post2 = new Post('Post 2');
    const video = new Video('https://example.com/v1.mp4');

    post1.tags.add(tag);
    post2.tags.add(tag);
    video.tags.add(tag);

    await orm.em.persist([post1, post2, video]).flush();
    orm.em.clear();

    const loadedTag = await orm.em.findOneOrFail(Tag, tag.id, {
      populate: ['posts', 'videos'],
    });

    expect(loadedTag.posts).toHaveLength(2);
    expect(loadedTag.videos).toHaveLength(1);
  });

  test('can set and clear M:N collection without initializing', async () => {
    const tag = new Tag('ToRemove');
    const post = new Post('Post to clear');
    post.tags.add(tag);

    await orm.em.persist(post).flush();
    orm.em.clear();

    const loadedPost = await orm.em.findOneOrFail(Post, post.id);

    loadedPost.tags.removeAll();
    await orm.em.flush();
    orm.em.clear();

    const reloadedPost = await orm.em.findOneOrFail(Post, post.id, { populate: ['tags'] });
    expect(reloadedPost.tags).toHaveLength(0);
  });

  test('load M:N with exclude option', async () => {
    const tag = new Tag('Full Tag');
    const post = new Post('Post with Tag');
    post.tags.add(tag);

    await orm.em.persist(post).flush();
    orm.em.clear();

    const loadedPost = await orm.em.findOneOrFail(Post, post.id, {
      populate: ['tags'],
      exclude: ['tags.name'],
    });

    expect(loadedPost.tags).toHaveLength(1);
    expect(loadedPost.tags[0].id).toBe(tag.id);
  });

  test('bidirectional propagation works with polymorphic M:N', async () => {
    const tag = new Tag('Propagate Tag');
    const post = new Post('Propagate Post');

    post.tags.add(tag);
    await orm.em.persist(post).flush();
    orm.em.clear();

    const loadedTag = await orm.em.findOneOrFail(Tag, tag.id, { populate: ['posts'] });
    expect(loadedTag.posts).toHaveLength(1);
    expect(loadedTag.posts[0].id).toBe(post.id);
  });

  test('load M:N with :ref populate hint (pivotJoin)', async () => {
    const tag = new Tag('Ref Tag');
    const post = new Post('Ref Post');
    post.tags.add(tag);

    await orm.em.persist(post).flush();
    orm.em.clear();

    const loadedPost = await orm.em.findOneOrFail(Post, post.id, {
      populate: ['tags:ref'],
    });

    expect(loadedPost.tags).toHaveLength(1);
    expect(loadedPost.tags[0].id).toBe(tag.id);
  });

  test('load inverse M:N with populateFilter', async () => {
    const tag1 = new Tag('Common');
    const tag2 = new Tag('Rare');
    const post1 = new Post('Post A');
    const post2 = new Post('Post B');

    post1.tags.add(tag1, tag2);
    post2.tags.add(tag1);

    await orm.em.persist([post1, post2]).flush();
    orm.em.clear();

    const posts = await orm.em.find(Post, {}, {
      populate: ['tags'],
      populateFilter: { tags: { name: 'Common' } },
    });

    expect(posts).toHaveLength(2);
    for (const p of posts) {
      expect(p.tags.getItems().every(t => t.name === 'Common')).toBe(true);
    }
  });

  test('load inverse M:N with populateWhere on inverse side', async () => {
    const tag = new Tag('Shared');
    const post1 = new Post('Post Alpha');
    const post2 = new Post('Post Beta');

    post1.tags.add(tag);
    post2.tags.add(tag);

    await orm.em.persist([post1, post2]).flush();
    orm.em.clear();

    // Load from inverse side (Tag -> Posts) with populateWhere filter
    const loadedTag = await orm.em.findOneOrFail(Tag, tag.id, {
      populate: ['posts'],
      populateWhere: { posts: { title: { $like: '%Alpha%' } } },
    });

    // Only posts matching the filter should be populated
    expect(loadedTag.posts).toHaveLength(1);
    expect(loadedTag.posts[0].title).toBe('Post Alpha');
  });

});

// Test for custom discriminator map in polymorphic M:N
@Entity()
class Category {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @ManyToMany(() => Article, article => article.categories)
  articles = new Collection<Article>(this);

  @ManyToMany(() => Product, product => product.categories)
  products = new Collection<Product>(this);

  constructor(name: string) {
    this.name = name;
  }

}

@Entity()
class Article {

  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

  @ManyToMany(() => Category, cat => cat.articles, {
    pivotTable: 'categorizables',
    discriminator: 'categorizable',
    discriminatorMap: {
      art: 'Article',
      prod: 'Product',
    },
    owner: true,
  })
  categories = new Collection<Category>(this);

  constructor(title: string) {
    this.title = title;
  }

}

@Entity()
class Product {

  @PrimaryKey()
  id!: number;

  @Property()
  sku!: string;

  @ManyToMany(() => Category, cat => cat.products, {
    pivotTable: 'categorizables',
    discriminator: 'categorizable',
    discriminatorMap: {
      art: 'Article',
      prod: 'Product',
    },
    owner: true,
  })
  categories = new Collection<Category>(this);

  constructor(sku: string) {
    this.sku = sku;
  }

}

describe('polymorphic M:N with custom discriminator map', () => {

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Category, Article, Product],
      dbName: ':memory:',
      metadataProvider: ReflectMetadataProvider,
    });
    await orm.schema.create();
  });

  afterAll(async () => {
    await orm.close(true);
  });

  beforeEach(async () => {
    await orm.schema.clear();
    orm.em.clear();
  });

  test('metadata has custom discriminator values', async () => {
    const articleMeta = orm.getMetadata().get(Article);
    const productMeta = orm.getMetadata().get(Product);

    const articleTagsProp = articleMeta.properties.categories;
    const productTagsProp = productMeta.properties.categories;

    expect(articleTagsProp.discriminatorValue).toBe('art');
    expect(productTagsProp.discriminatorValue).toBe('prod');

    expect(articleTagsProp.discriminatorMap).toEqual({
      art: Article,
      prod: Product,
    });
    expect(productTagsProp.discriminatorMap).toEqual({
      art: Article,
      prod: Product,
    });
  });

  test('pivot table uses custom discriminator values', async () => {
    const category = new Category('Electronics');
    const article = new Article('Best Electronics 2024');
    const product = new Product('ELEC-001');

    article.categories.add(category);
    product.categories.add(category);

    await orm.em.persist([article, product]).flush();

    const pivotData = await orm.em.execute('SELECT * FROM categorizables ORDER BY categorizable_type, categorizable_id');

    expect(pivotData).toHaveLength(2);
    expect(pivotData[0].categorizable_type).toBe('art');
    expect(pivotData[1].categorizable_type).toBe('prod');
  });

  test('loading from owner side with custom discriminator', async () => {
    const category = new Category('Books');
    const article = new Article('Top 10 Books');
    article.categories.add(category);

    await orm.em.persist(article).flush();
    orm.em.clear();

    const loadedArticle = await orm.em.findOneOrFail(Article, article.id, { populate: ['categories'] });
    expect(loadedArticle.categories).toHaveLength(1);
    expect(loadedArticle.categories[0].name).toBe('Books');
  });

  test('loading from inverse side with custom discriminator', async () => {
    const category = new Category('Tech');
    const article = new Article('Tech News');
    const product = new Product('TECH-001');

    article.categories.add(category);
    product.categories.add(category);

    await orm.em.persist([article, product]).flush();
    orm.em.clear();

    const loadedCategory = await orm.em.findOneOrFail(Category, category.id, {
      populate: ['articles', 'products'],
    });

    expect(loadedCategory.articles).toHaveLength(1);
    expect(loadedCategory.products).toHaveLength(1);
    expect(loadedCategory.articles[0].title).toBe('Tech News');
    expect(loadedCategory.products[0].sku).toBe('TECH-001');
  });

  test('loading multiple owners in batch', async () => {
    const category1 = new Category('Cat1');
    const category2 = new Category('Cat2');
    const article1 = new Article('Article 1');
    const article2 = new Article('Article 2');

    article1.categories.add(category1, category2);
    article2.categories.add(category1);

    await orm.em.persist([article1, article2]).flush();
    orm.em.clear();

    const articles = await orm.em.find(Article, {}, { populate: ['categories'] });
    expect(articles).toHaveLength(2);
    expect(articles.find(a => a.title === 'Article 1')!.categories).toHaveLength(2);
    expect(articles.find(a => a.title === 'Article 2')!.categories).toHaveLength(1);
  });

  test('inverse side returns empty collection when no relations exist', async () => {
    const category = new Category('Empty Cat');
    await orm.em.persist(category).flush();
    orm.em.clear();

    const loadedCategory = await orm.em.findOneOrFail(Category, category.id, {
      populate: ['articles', 'products'],
    });

    expect(loadedCategory.articles).toHaveLength(0);
    expect(loadedCategory.products).toHaveLength(0);
  });

  test('throws error for invalid class name in discriminatorMap', async () => {
    @Entity()
    class MyTag {

      @PrimaryKey()
      id!: number;

      @Property()
      name!: string;

      @ManyToMany(() => MyPost, post => post.tags)
      posts = new Collection<MyPost>(this);

    }

    @Entity()
    class MyPost {

      @PrimaryKey()
      id!: number;

      @ManyToMany(() => MyTag, tag => tag.posts, {
        pivotTable: 'my_taggables',
        discriminator: 'taggable',
        discriminatorMap: {
          post: 'MyPost',
          invalid: 'NonExistentEntity', // This class doesn't exist
        },
        owner: true,
      })
      tags = new Collection<MyTag>(this);

    }

    await expect(MikroORM.init({
      entities: [MyTag, MyPost],
      dbName: ':memory:',
      metadataProvider: ReflectMetadataProvider,
    })).rejects.toThrow(/NonExistentEntity.*was not discovered.*MyPost\.tags discriminatorMap/);
  });

});
