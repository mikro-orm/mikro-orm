import { Collection, MikroORM } from '@mikro-orm/sqlite';
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
}

@Entity()
class Product {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Property()
  price!: number;

  @ManyToOne(() => Author, { nullable: true })
  author?: Author;

  @OneToMany(() => Image, image => image.imageable)
  images = new Collection<Image>(this);
}

@Entity()
class Article {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Property()
  title!: string;

  @ManyToOne(() => Author, { nullable: true })
  author?: Author;

  @OneToMany(() => Image, image => image.imageable)
  images = new Collection<Image>(this);
}

@Entity()
class Image {
  @PrimaryKey()
  id!: number;

  @Property()
  url!: string;

  @ManyToOne(() => [Product, Article], { nullable: true })
  imageable?: Product | Article | null;
}

describe('filtering by properties of polymorphic relation targets', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Author, Product, Article, Image],
      dbName: ':memory:',
      metadataProvider: ReflectMetadataProvider,
    });
    await orm.schema.create();

    const em = orm.em.fork();
    const author = em.create(Author, { name: 'Jon' });
    const p1 = em.create(Product, { name: 'shared', price: 20, author });
    const p2 = em.create(Product, { name: 'cheap', price: 5 });
    const a1 = em.create(Article, { name: 'shared', title: 'foo', author });
    const a2 = em.create(Article, { name: 'other', title: 'bar' });
    em.create(Image, { url: 'p1', imageable: p1 });
    em.create(Image, { url: 'p2', imageable: p2 });
    em.create(Image, { url: 'a1', imageable: a1 });
    em.create(Image, { url: 'a2', imageable: a2 });
    em.create(Image, { url: 'none', imageable: null });
    await em.flush();
  });

  afterAll(() => orm.close(true));

  async function urls(where: Record<string, unknown>, options: Record<string, unknown> = {}) {
    const images = await orm.em.fork().find(Image, where as any, { orderBy: { url: 'asc' }, ...options });
    return images.map(i => i.url);
  }

  test('property of the first target keeps the existing join', async () => {
    const sql = orm.em
      .createQueryBuilder(Image, 'i')
      .where({ imageable: { price: { $gt: 10 } } })
      .getFormattedQuery();
    expect(sql).toBe(
      "select `i`.* from `image` as `i` left join `product` as `p1` on `i`.`imageable_id` = `p1`.`id` and `i`.`imageable_type` = 'product' where `p1`.`price` > 10",
    );
    await expect(urls({ imageable: { price: { $gt: 10 } } })).resolves.toEqual(['p1']);
  });

  test('property of another target joins that target', async () => {
    await expect(urls({ imageable: { title: 'foo' } })).resolves.toEqual(['a1']);
    await expect(urls({ imageable: { title: { $ne: 'foo' } } })).resolves.toEqual(['a2']);
  });

  test('property shared by several targets matches any of them', async () => {
    const sql = orm.em
      .createQueryBuilder(Image, 'i')
      .where({ imageable: { name: 'shared' } })
      .getFormattedQuery();
    expect(sql).toBe(
      'select `i`.* from `image` as `i` ' +
        "left join `product` as `p1` on `i`.`imageable_id` = `p1`.`id` and `i`.`imageable_type` = 'product' " +
        "left join `article` as `a2` on `i`.`imageable_id` = `a2`.`id` and `i`.`imageable_type` = 'article' " +
        "where ((`p1`.`name` = 'shared' and `p1`.`id` is not null) or (`a2`.`name` = 'shared' and `a2`.`id` is not null))",
    );
    await expect(urls({ imageable: { name: 'shared' } })).resolves.toEqual(['a1', 'p1']);
    await expect(urls({ imageable: { name: { $in: ['cheap', 'other'] } } })).resolves.toEqual(['a2', 'p2']);
  });

  test('targets are picked by all queried properties', async () => {
    await expect(urls({ imageable: { name: 'shared', title: 'foo' } })).resolves.toEqual(['a1']);
    // only targets defining all the queried properties are considered, so `name: 'cheap'` cannot match a product here
    await expect(urls({ imageable: { $or: [{ name: 'cheap' }, { title: 'bar' }] } })).resolves.toEqual(['a2']);
    await expect(urls({ imageable: { $or: [{ name: 'cheap' }, { name: 'other' }] } })).resolves.toEqual(['a2', 'p2']);
  });

  test('combines with other conditions and group operators', async () => {
    await expect(urls({ url: { $like: 'a%' }, imageable: { name: 'shared' } })).resolves.toEqual(['a1']);
    await expect(urls({ $or: [{ url: 'none' }, { imageable: { title: 'bar' } }] })).resolves.toEqual(['a2', 'none']);
    await expect(urls({ $not: { imageable: { title: 'foo' } } })).resolves.toEqual(['a2', 'none', 'p1', 'p2']);
    await expect(urls({ imageable: { name: 'shared' }, $and: [{ url: { $ne: 'p1' } }] })).resolves.toEqual(['a1']);
  });

  test('nested relations of a target', async () => {
    await expect(urls({ imageable: { author: { name: 'Jon' } } })).resolves.toEqual(['a1', 'p1']);
    await expect(urls({ imageable: { title: 'foo', author: { name: 'Jon' } } })).resolves.toEqual(['a1']);
  });

  test('primary key conditions do not join', async () => {
    const sql = orm.em
      .createQueryBuilder(Image, 'i')
      .where({ imageable: { id: 1 } })
      .getFormattedQuery();
    expect(sql).not.toContain('join');
  });

  test('works with joined populate and count', async () => {
    const em = orm.em.fork();
    const images = await em.find(
      Image,
      { imageable: { name: 'shared' } },
      { populate: ['imageable'], strategy: 'joined', orderBy: { url: 'asc' } },
    );
    expect(images.map(i => [i.url, i.imageable?.constructor.name])).toEqual([
      ['a1', 'Article'],
      ['p1', 'Product'],
    ]);
    await expect(em.count(Image, { imageable: { name: 'shared' } })).resolves.toBe(2);
    await expect(em.count(Image, { imageable: { title: 'foo' } })).resolves.toBe(1);
  });

  test('works with native update and delete', async () => {
    const em = orm.em.fork();
    await em.begin();

    try {
      await expect(em.nativeUpdate(Image, { imageable: { name: 'shared' } }, { url: 'updated' })).resolves.toBe(2);
      await expect(em.nativeDelete(Image, { imageable: { title: 'bar' } })).resolves.toBe(1);
      await expect(em.count(Image, { url: 'updated' })).resolves.toBe(2);
    } finally {
      await em.rollback();
    }
  });

  test('unknown property on all targets throws', async () => {
    await expect(urls({ imageable: { foo: 'bar' } })).rejects.toThrow(
      'Trying to query by not existing property Product.foo',
    );
  });
});

@Entity()
class Page {
  @PrimaryKey()
  id!: number;
}

@Entity()
class Video {
  @PrimaryKey({ autoincrement: false })
  code!: number;
}

@Entity()
class Thumbnail {
  @PrimaryKey()
  id!: number;

  @Property()
  url!: string;

  @ManyToOne(() => [Page, Video])
  source!: Page | Video;
}

describe('filtering by primary key of a polymorphic relation target', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Page, Video, Thumbnail],
      dbName: ':memory:',
      metadataProvider: ReflectMetadataProvider,
    });
    await orm.schema.create();

    const em = orm.em.fork();
    em.create(Thumbnail, { url: 'page', source: em.create(Page, { id: 7 }) });
    em.create(Thumbnail, { url: 'video', source: em.create(Video, { code: 7 }) });
    await em.flush();
  });

  afterAll(() => orm.close(true));

  test('primary key defined only on another target', async () => {
    const videos = await orm.em.fork().find(Thumbnail, { source: { code: 7 } });
    expect(videos.map(t => t.url)).toEqual(['video']);
    // the FK column alone would match both, the type needs to be checked too
    const pages = await orm.em.fork().find(Thumbnail, { source: { id: 7 } });
    expect(pages.map(t => t.url)).toEqual(['page']);
  });
});
