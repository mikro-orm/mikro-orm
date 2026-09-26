import { type FilterQuery, MikroORM } from '@mikro-orm/sqlite';
import { Entity, ManyToOne, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
class Product {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;
}

@Entity()
class Article {
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

  @ManyToOne(() => [Product, Article])
  imageable!: Product | Article;
}

describe('polymorphic relation conditions by target primary key', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Product, Article, Image],
      dbName: ':memory:',
      metadataProvider: ReflectMetadataProvider,
    });
    await orm.schema.create();

    const em = orm.em.fork();
    const p1 = em.create(Product, { id: 1, name: 'p1' });
    const p2 = em.create(Product, { id: 2, name: 'p2' });
    const a1 = em.create(Article, { id: 1, title: 'a1' });
    em.create(Image, { url: 'p1', imageable: p1 });
    em.create(Image, { url: 'p2', imageable: p2 });
    em.create(Image, { url: 'a1', imageable: a1 });
    await em.flush();
  });

  afterAll(() => orm.close(true));

  async function urls(where: FilterQuery<Image>) {
    const images = await orm.em.fork().find(Image, where, { orderBy: { url: 'asc' } });
    return images.map(i => i.url);
  }

  test('compares the FK column', async () => {
    const sql = orm.em
      .createQueryBuilder(Image, 'i')
      .where({ imageable: { id: 1 } })
      .getFormattedQuery();
    expect(sql).toBe('select `i`.* from `image` as `i` where `i`.`imageable_id` = 1');
    await expect(urls({ imageable: { id: 1 } })).resolves.toEqual(['a1', 'p1']);
    await expect(urls({ imageable: { id: { $in: [2] } } })).resolves.toEqual(['p2']);
    await expect(urls({ imageable: { id: { $ne: 1 } } })).resolves.toEqual(['p2']);
  });
});
