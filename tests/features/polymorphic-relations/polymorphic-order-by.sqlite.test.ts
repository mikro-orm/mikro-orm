import { MikroORM } from '@mikro-orm/sqlite';
import { Entity, ManyToOne, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
class Product {
  @PrimaryKey()
  id!: number;

  @Property()
  price!: number;
}

@Entity()
class Article {
  @PrimaryKey()
  id!: number;

  @Property()
  price!: number;
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

// ordering uses the first target only, rows pointing to other targets sort as nulls
test('ordering by a target property keeps rows pointing to other targets', async () => {
  const orm = await MikroORM.init({
    entities: [Product, Article, Image],
    dbName: ':memory:',
    metadataProvider: ReflectMetadataProvider,
  });
  await orm.schema.create();

  const em = orm.em.fork();
  em.create(Image, { url: 'p2', imageable: em.create(Product, { price: 2 }) });
  em.create(Image, { url: 'a', imageable: em.create(Article, { price: 0 }) });
  em.create(Image, { url: 'p1', imageable: em.create(Product, { price: 1 }) });
  await em.flush();

  const images = await orm.em.fork().find(Image, {}, { orderBy: { imageable: { price: 'asc' } } });
  expect(images.map(i => i.url)).toEqual(['a', 'p1', 'p2']);

  await orm.close(true);
});
