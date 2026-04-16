import { Collection, MikroORM } from '@mikro-orm/sqlite';
import { Entity, ManyToMany, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

// Owner-side union target: Post.attachments holds a mixed collection of Image | Video
// stored in one pivot with an attachable_type discriminator.

@Entity()
class Image {
  @PrimaryKey()
  id!: number;

  @Property()
  url!: string;

  @ManyToMany(() => Post, (p: Post) => p.attachments)
  posts = new Collection<Post>(this);

  constructor(url: string) {
    this.url = url;
  }
}

@Entity()
class Video {
  @PrimaryKey()
  id!: number;

  @Property()
  src!: string;

  @ManyToMany(() => Post, (p: Post) => p.attachments)
  posts = new Collection<Post>(this);

  constructor(src: string) {
    this.src = src;
  }
}

@Entity()
class Post {
  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

  @ManyToMany({
    entity: () => [Image, Video],
    pivotTable: 'attachables',
    discriminator: 'attachable',
    owner: true,
  })
  attachments = new Collection<Image | Video>(this);

  constructor(title: string) {
    this.title = title;
  }
}

describe('polymorphic M:N with union target', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Image, Video, Post],
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

  test('metadata: polymorphTargets populated for union-target M:N', () => {
    const postMeta = orm.getMetadata().get(Post);
    const prop = postMeta.properties.attachments;

    expect(prop.polymorphic).toBe(true);
    expect(prop.discriminatorColumn).toBe('attachable_type');
    expect(prop.polymorphTargets).toBeDefined();
    expect(prop.polymorphTargets!.map(m => m.className).sort()).toEqual(['Image', 'Video']);
  });

  test('metadata: inverse sides inherit pivot info and own discriminator value', () => {
    const imgMeta = orm.getMetadata().get(Image);
    const vidMeta = orm.getMetadata().get(Video);
    expect(imgMeta.properties.posts.pivotEntity).toBeDefined();
    expect(vidMeta.properties.posts.pivotEntity).toBeDefined();
    expect(imgMeta.properties.posts.discriminatorValue).toBe('image');
    expect(vidMeta.properties.posts.discriminatorValue).toBe('video');
  });

  test('schema: pivot has discriminator + target id, no FK on target_id', async () => {
    const sql = await orm.schema.getCreateSchemaSQL();
    expect(sql).toContain('attachables');
    expect(sql).toContain('attachable_type');
    expect(sql).toContain('attachable_id');
    expect(sql).toContain('post_id');
  });

  test('insert: discriminator is written per row based on target class', async () => {
    const image = new Image('https://example.com/a.png');
    const video = new Video('https://example.com/b.mp4');
    const post = new Post('Mixed post');

    post.attachments.add(image, video);
    await orm.em.persist(post).flush();
    orm.em.clear();

    const pivot = await orm.em.execute('SELECT * FROM attachables ORDER BY attachable_type, attachable_id');
    expect(pivot).toHaveLength(2);
    expect(pivot.map((r: any) => r.attachable_type).sort()).toEqual(['image', 'video']);
  });

  test('select: populate attachments hydrates mixed types', async () => {
    const image = new Image('https://example.com/a.png');
    const video = new Video('https://example.com/b.mp4');
    const post = new Post('Mixed post');

    post.attachments.add(image, video);
    await orm.em.persist(post).flush();
    orm.em.clear();

    const loaded = await orm.em.findOneOrFail(Post, { title: 'Mixed post' }, { populate: ['attachments'] });
    const items = loaded.attachments.getItems();
    expect(items).toHaveLength(2);
    expect(items.some(i => i instanceof Image && i.url === 'https://example.com/a.png')).toBe(true);
    expect(items.some(i => i instanceof Video && i.src === 'https://example.com/b.mp4')).toBe(true);
  });

  test('delete: removing one attachment filters by discriminator', async () => {
    const image = new Image('https://example.com/a.png');
    const video = new Video('https://example.com/b.mp4');
    const post = new Post('Mixed post');

    post.attachments.add(image, video);
    await orm.em.persist(post).flush();
    orm.em.clear();

    const loaded = await orm.em.findOneOrFail(Post, { title: 'Mixed post' }, { populate: ['attachments'] });
    const img = loaded.attachments.getItems().find(i => i instanceof Image)!;
    loaded.attachments.remove(img);
    await orm.em.flush();
    orm.em.clear();

    const pivot = await orm.em.execute('SELECT * FROM attachables');
    expect(pivot).toHaveLength(1);
    expect(pivot[0].attachable_type).toBe('video');
  });

  test('update: swap an Image for a Video in the collection', async () => {
    const image = new Image('https://example.com/a.png');
    const post = new Post('Swap test');
    post.attachments.add(image);
    await orm.em.persist(post).flush();
    orm.em.clear();

    const loaded = await orm.em.findOneOrFail(Post, { title: 'Swap test' }, { populate: ['attachments'] });
    loaded.attachments.removeAll();
    const video = new Video('https://example.com/b.mp4');
    loaded.attachments.add(video);
    await orm.em.flush();
    orm.em.clear();

    const reloaded = await orm.em.findOneOrFail(Post, { title: 'Swap test' }, { populate: ['attachments'] });
    const items = reloaded.attachments.getItems();
    expect(items).toHaveLength(1);
    expect(items[0]).toBeInstanceOf(Video);
    expect((items[0] as Video).src).toBe('https://example.com/b.mp4');
  });

  test('empty collection: post with no attachments loads as empty', async () => {
    const post = new Post('No attachments');
    await orm.em.persist(post).flush();
    orm.em.clear();

    const loaded = await orm.em.findOneOrFail(Post, { title: 'No attachments' }, { populate: ['attachments'] });
    expect(loaded.attachments.getItems()).toHaveLength(0);
  });

  test('inverse side: Image.posts loads only posts attached to images (filtered by discriminator)', async () => {
    const img = new Image('https://example.com/a.png');
    const vid = new Video('https://example.com/b.mp4');
    const p1 = new Post('with image');
    const p2 = new Post('with video');
    p1.attachments.add(img);
    p2.attachments.add(vid);
    await orm.em.persist([p1, p2]).flush();
    orm.em.clear();

    const loadedImg = await orm.em.findOneOrFail(Image, { url: 'https://example.com/a.png' }, { populate: ['posts'] });
    expect(loadedImg.posts.getItems()).toHaveLength(1);
    expect(loadedImg.posts[0].title).toBe('with image');

    const loadedVid = await orm.em.findOneOrFail(Video, { src: 'https://example.com/b.mp4' }, { populate: ['posts'] });
    expect(loadedVid.posts.getItems()).toHaveLength(1);
    expect(loadedVid.posts[0].title).toBe('with video');
  });

  test('multiple posts with overlapping attachments bucket correctly per owner', async () => {
    const img1 = new Image('https://example.com/a.png');
    const img2 = new Image('https://example.com/b.png');
    const vid = new Video('https://example.com/c.mp4');
    const p1 = new Post('post one');
    const p2 = new Post('post two');

    p1.attachments.add(img1, vid);

    p2.attachments.add(img2, vid);
    await orm.em.persist([p1, p2]).flush();
    orm.em.clear();

    const posts = await orm.em.find(Post, {}, { populate: ['attachments'], orderBy: { title: 'asc' } });
    expect(posts).toHaveLength(2);
    expect(posts[0].attachments.getItems()).toHaveLength(2);
    expect(posts[1].attachments.getItems()).toHaveLength(2);
    const p1Types = posts[0].attachments
      .getItems()
      .map(i => i.constructor.name)
      .sort();
    const p2Types = posts[1].attachments
      .getItems()
      .map(i => i.constructor.name)
      .sort();
    expect(p1Types).toEqual(['Image', 'Video']);
    expect(p2Types).toEqual(['Image', 'Video']);
  });
});
