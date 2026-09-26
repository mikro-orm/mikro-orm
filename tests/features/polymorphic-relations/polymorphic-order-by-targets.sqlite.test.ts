import { MikroORM, type QueryOrderMap, raw } from '@mikro-orm/sqlite';
import {
  Entity,
  Formula,
  ManyToOne,
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

  @Formula(alias => `${alias}.price * 2`)
  rank?: number;
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

  @Formula(alias => `length(${alias}.title)`)
  rank?: number;
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

@Entity()
class Thumbnail {
  @PrimaryKey()
  id!: number;

  @Property()
  url!: string;

  @ManyToOne(() => [Product, Article])
  imageable!: Product | Article;
}

describe('ordering by properties of polymorphic relation targets', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Author, Product, Article, Image, Thumbnail],
      dbName: ':memory:',
      metadataProvider: ReflectMetadataProvider,
    });
    await orm.schema.create();

    const em = orm.em.fork();
    em.create(Image, { url: 'p-b', imageable: em.create(Product, { name: 'b', price: 2 }) });
    em.create(Image, {
      url: 'a-c',
      imageable: em.create(Article, { name: 'c', title: 'y', author: em.create(Author, { name: 'Bob' }) }),
    });
    em.create(Image, { url: 'p-d', imageable: em.create(Product, { name: 'd', price: 1 }) });
    em.create(Image, {
      url: 'a-a',
      imageable: em.create(Article, { name: 'a', title: 'x', author: em.create(Author, { name: 'Jon' }) }),
    });
    em.create(Thumbnail, { url: 'p', imageable: em.create(Product, { name: 'e', price: 3 }) });
    em.create(Thumbnail, { url: 'a', imageable: em.create(Article, { name: 'f', title: 'z' }) });
    await em.flush();
  });

  afterAll(() => orm.close(true));

  async function urls(orderBy: QueryOrderMap<Image>) {
    const images = await orm.em.fork().find(Image, { imageable: { $ne: null } }, { orderBy });
    return images.map(i => i.url);
  }

  test('property shared by several targets orders across all of them', async () => {
    const sql = orm.em
      .createQueryBuilder(Image, 'i')
      .orderBy({ imageable: { name: 'asc' } })
      .getFormattedQuery();
    expect(sql).toBe(
      'select `i`.* from `image` as `i` ' +
        "left join `product` as `p1` on `i`.`imageable_id` = `p1`.`id` and `i`.`imageable_type` = 'product' " +
        "left join `article` as `a2` on `i`.`imageable_id` = `a2`.`id` and `i`.`imageable_type` = 'article' " +
        'order by coalesce(`p1`.`name`, `a2`.`name`) asc',
    );
    await expect(urls({ imageable: { name: 'asc' } })).resolves.toEqual(['a-a', 'p-b', 'a-c', 'p-d']);
    await expect(urls({ imageable: { name: 'desc' } })).resolves.toEqual(['p-d', 'a-c', 'p-b', 'a-a']);
  });

  test('property of another target orders by that target', async () => {
    // rows pointing to other targets have no title and sort as nulls
    // the order map type only allows properties all targets define
    await expect(urls({ imageable: { title: 'asc' }, url: 'asc' } as QueryOrderMap<Image>)).resolves.toEqual([
      'p-b',
      'p-d',
      'a-a',
      'a-c',
    ]);
  });

  test('property of the first target orders by that target', async () => {
    // rows pointing to other targets have no price and sort as nulls
    await expect(urls({ imageable: { price: 'asc' }, url: 'asc' } as QueryOrderMap<Image>)).resolves.toEqual([
      'a-a',
      'a-c',
      'p-d',
      'p-b',
    ]);
  });

  test('reuses the joins of a condition on the same targets', async () => {
    const sql = orm.em
      .createQueryBuilder(Image, 'i')
      .where({ imageable: { name: { $ne: 'x' } } })
      .orderBy({ imageable: { name: 'asc' } })
      .getFormattedQuery();
    expect(sql.match(/left join/g)).toHaveLength(2);
    expect(sql).toMatch('order by coalesce(`p1`.`name`, `a2`.`name`) asc');

    const sql2 = orm.em
      .createQueryBuilder(Image, 'i')
      .orderBy({ imageable: { name: 'asc' } })
      .where({ imageable: { name: { $ne: 'x' } } })
      .getFormattedQuery();
    expect(sql2).toBe(sql);
  });

  test('ordering does not drop rows pointing to other targets', async () => {
    const thumbnails = await orm.em.fork().find(Thumbnail, {}, { orderBy: { imageable: { name: 'desc' } } });
    expect(thumbnails.map(t => t.url)).toEqual(['a', 'p']);
    const thumbnails2 = await orm.em
      .fork()
      .find(Thumbnail, {}, { orderBy: { imageable: { price: 'asc' } } as QueryOrderMap<Thumbnail> });
    expect(thumbnails2.map(t => t.url)).toEqual(['a', 'p']);
  });

  test('relations of a target and populated joins', async () => {
    await expect(
      urls({ imageable: { author: { name: 'desc' } }, url: 'asc' } as QueryOrderMap<Image>),
    ).resolves.toEqual(['a-a', 'a-c', 'p-b', 'p-d']);
    const images = await orm.em
      .fork()
      .find(Image, {}, { populate: ['imageable'], strategy: 'joined', orderBy: { imageable: { name: 'asc' } } });
    expect(images.map(i => i.url)).toEqual(['a-a', 'p-b', 'a-c', 'p-d']);
  });

  test('shared primary key orders by the FK column', async () => {
    const sql = orm.em
      .createQueryBuilder(Image, 'i')
      .orderBy({ imageable: { id: 'asc' } })
      .getFormattedQuery();
    expect(sql).toBe('select `i`.* from `image` as `i` order by `i`.`imageable_id` asc');
  });

  test('raw fragments and formulas use the first target', async () => {
    const qb = () => orm.em.createQueryBuilder(Image, 'i');
    expect(
      qb()
        .orderBy({ imageable: { [raw('lower(name)')]: 'asc' } })
        .getFormattedQuery(),
    ).toMatch(
      "left join `product` as `p1` on `i`.`imageable_id` = `p1`.`id` and `i`.`imageable_type` = 'product' order by lower(name) asc",
    );
    expect(
      qb()
        .orderBy({ imageable: { rank: 'desc' } })
        .getFormattedQuery(),
    ).toMatch('order by `p1`.price * 2 desc');
    await expect(urls({ imageable: { rank: 'desc' }, url: 'asc' })).resolves.toEqual(['p-b', 'p-d', 'a-a', 'a-c']);
  });

  test('unknown property on all targets throws', async () => {
    await expect(urls({ imageable: { foo: 'asc' } } as QueryOrderMap<Image>)).rejects.toThrow(
      'Trying to query by not existing property Product.foo',
    );
  });
});
