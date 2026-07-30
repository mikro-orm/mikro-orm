import { Collection, MikroORM } from '@mikro-orm/sqlite';
import { Entity, ManyToMany, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
class Tag {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

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

  @ManyToMany(() => Tag, tag => tag.posts, {
    pivotTable: 'taggables',
    discriminator: 'taggable',
    fixedOrderColumn: 'sort_order',
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

  @ManyToMany(() => Tag, tag => tag.videos, {
    pivotTable: 'taggables',
    discriminator: 'taggable',
    fixedOrderColumn: 'sort_order',
    owner: true,
  })
  tags = new Collection<Tag>(this);

  constructor(url: string) {
    this.url = url;
  }
}

@Entity()
class Image {
  @PrimaryKey()
  id!: number;

  @Property()
  path!: string;

  constructor(path: string) {
    this.path = path;
  }
}

@Entity()
class Clip {
  @PrimaryKey()
  id!: number;

  @Property()
  src!: string;

  constructor(src: string) {
    this.src = src;
  }
}

@Entity()
class Article {
  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

  @ManyToMany({
    entity: () => [Image, Clip],
    pivotTable: 'attachables',
    discriminator: 'attachable',
    fixedOrderColumn: 'sort_order',
    owner: true,
  })
  attachments = new Collection<Image | Clip>(this);

  constructor(title: string) {
    this.title = title;
  }
}

describe('polymorphic M:N with fixedOrderColumn', () => {
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

  test('the fixed order column is the only pivot primary key', async () => {
    const pivotMeta = orm.getMetadata().get(orm.getMetadata().get(Post).properties.tags.pivotEntity);

    expect(pivotMeta.primaryKeys).toEqual(['sort_order']);
    expect(pivotMeta.compositePK).toBe(false);
    expect(pivotMeta.properties.sort_order.autoincrement).toBe(true);

    const sql = await orm.schema.getCreateSchemaSQL();
    expect(sql).toContain(
      'create table `taggables` (`sort_order` integer not null primary key autoincrement, `taggable_type` text not null, `taggable_id` integer not null, `tag_id` integer not null);',
    );
  });

  test('collection order is preserved for both polymorphic owners', async () => {
    const tag1 = new Tag('TypeScript');
    const tag2 = new Tag('Testing');
    const tag3 = new Tag('ORM');
    const post = new Post('MikroORM Guide');
    const video = new Video('https://example.com/video.mp4');

    post.tags.add(tag3, tag1, tag2);
    video.tags.add(tag2, tag3);
    await orm.em.persist([post, video]).flush();
    orm.em.clear();

    const loadedPost = await orm.em.findOneOrFail(Post, post.id, { populate: ['tags'] });
    expect(loadedPost.tags.getItems().map(t => t.name)).toEqual(['ORM', 'TypeScript', 'Testing']);

    const loadedVideo = await orm.em.findOneOrFail(Video, video.id, { populate: ['tags'] });
    expect(loadedVideo.tags.getItems().map(t => t.name)).toEqual(['Testing', 'ORM']);

    const loadedTag = await orm.em.findOneOrFail(Tag, tag3.id, { populate: ['posts', 'videos'] });
    expect(loadedTag.posts.getItems().map(p => p.title)).toEqual(['MikroORM Guide']);
    expect(loadedTag.videos.getItems().map(v => v.url)).toEqual(['https://example.com/video.mp4']);
  });

  test('reordering and removing items keeps the owners isolated', async () => {
    const tag1 = new Tag('TypeScript');
    const tag2 = new Tag('Testing');
    const tag3 = new Tag('ORM');
    const post = new Post('MikroORM Guide');
    const video = new Video('https://example.com/video.mp4');

    post.tags.add(tag1, tag2, tag3);
    video.tags.add(tag1, tag2);
    await orm.em.persist([post, video]).flush();
    orm.em.clear();

    const loadedPost = await orm.em.findOneOrFail(Post, post.id, { populate: ['tags'] });
    loadedPost.tags.set([loadedPost.tags[2], loadedPost.tags[0]]);
    await orm.em.flush();
    orm.em.clear();

    const reloadedPost = await orm.em.findOneOrFail(Post, post.id, { populate: ['tags'] });
    expect(reloadedPost.tags.getItems().map(t => t.name)).toEqual(['ORM', 'TypeScript']);

    const reloadedVideo = await orm.em.findOneOrFail(Video, video.id, { populate: ['tags'] });
    expect(reloadedVideo.tags.getItems().map(t => t.name)).toEqual(['TypeScript', 'Testing']);
  });
});

describe('union target polymorphic M:N with fixedOrderColumn', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Image, Clip, Article],
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

  test('the fixed order column is the only pivot primary key', async () => {
    const pivotMeta = orm.getMetadata().get(orm.getMetadata().get(Article).properties.attachments.pivotEntity);

    expect(pivotMeta.primaryKeys).toEqual(['sort_order']);
    expect(pivotMeta.compositePK).toBe(false);

    const sql = await orm.schema.getCreateSchemaSQL();
    expect(sql).toContain(
      'create table `attachables` (`sort_order` integer not null primary key autoincrement, `article_id` integer not null, `attachable_type` text not null, `attachable_id` integer not null);',
    );
  });

  test('collection order is preserved across target types', async () => {
    const article = new Article('MikroORM Guide');
    article.attachments.add(new Clip('clip.mp4'), new Image('logo.png'), new Clip('outro.mp4'));
    await orm.em.persist(article).flush();
    orm.em.clear();

    const loaded = await orm.em.findOneOrFail(Article, article.id, { populate: ['attachments'] });
    expect(loaded.attachments.getItems().map(a => (a instanceof Clip ? a.src : a.path))).toEqual([
      'clip.mp4',
      'logo.png',
      'outro.mp4',
    ]);
  });
});
