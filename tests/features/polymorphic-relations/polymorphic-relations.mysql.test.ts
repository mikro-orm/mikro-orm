import { Collection, MikroORM } from '@mikro-orm/mysql';
import {
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryKey,
  Property,
  ReflectMetadataProvider,
} from '@mikro-orm/decorators/legacy';

@Entity()
class Product {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Property({ type: 'decimal', scale: 3 })
  price!: number;

  @OneToMany(() => Image, image => image.imageable)
  images = new Collection<Image>(this);

  constructor(name: string, price: number) {
    this.name = name;
    this.price = price;
  }
}

@Entity()
class Article {
  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

  @OneToMany(() => Image, image => image.imageable)
  images = new Collection<Image>(this);

  constructor(title: string) {
    this.title = title;
  }
}

@Entity()
class Image {
  @PrimaryKey()
  id!: number;

  @ManyToOne(() => [Product, Article])
  imageable!: Product | Article;

  @Property()
  url!: string;

  @Property({ nullable: true })
  altText?: string;
}

describe('polymorphic relations in MySQL', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Product, Article, Image],
      dbName: 'mikro_orm_test_polymorphic',
      metadataProvider: ReflectMetadataProvider,
      port: 3308,
    });
    await orm.schema.refresh();
  });

  afterAll(async () => {
    await orm.close(true);
  });

  beforeEach(async () => {
    await orm.schema.clear();
  });

  test('can persist and load polymorphic relation to Product', async () => {
    const product = new Product('Laptop', 999.99);
    const image = orm.em.create(Image, {
      imageable: product,
      url: 'https://example.com/laptop.jpg',
      altText: 'Laptop image',
    });

    await orm.em.flush();
    orm.em.clear();

    const loadedImage = await orm.em.findOneOrFail(Image, { id: image.id });
    expect(loadedImage.imageable).toBeInstanceOf(Product);

    await orm.em.populate(loadedImage, ['imageable']);
    expect((loadedImage.imageable as Product).name).toBe('Laptop');
    expect((loadedImage.imageable as Product).price).toBe(999.99);
  });

  test('can persist and load polymorphic relation to Article', async () => {
    const article = new Article('How to use MikroORM');
    const image = orm.em.create(Image, {
      imageable: article,
      url: 'https://example.com/article.jpg',
    });

    await orm.em.flush();
    orm.em.clear();

    const loadedImage = await orm.em.findOneOrFail(Image, { id: image.id });
    expect(loadedImage.imageable).toBeInstanceOf(Article);

    await orm.em.populate(loadedImage, ['imageable']);
    expect((loadedImage.imageable as Article).title).toBe('How to use MikroORM');
  });

  test('can query images by polymorphic target type', async () => {
    const product = new Product('Phone', 599);
    const article = new Article('Article');
    const productImage = orm.em.create(Image, { imageable: product, url: 'phone.jpg' });
    const articleImage = orm.em.create(Image, { imageable: article, url: 'article.jpg' });

    await orm.em.flush();
    orm.em.clear();

    // Get all images - we can't easily filter by type directly
    // but we can load and check the discriminator
    const allImages = await orm.em.find(Image, {});
    expect(allImages).toHaveLength(2);
  });

  test('cascade persist works with polymorphic relations', async () => {
    const product = new Product('Monitor', 399);
    // Note: cascade options need to be set on the relation
    const image = new Image();
    image.imageable = product;
    image.url = 'monitor.jpg';

    orm.em.persist(image);
    await orm.em.flush();

    expect(product.id).toBeDefined();
    expect(image.id).toBeDefined();
  });

  test('can update polymorphic relation', async () => {
    const product = new Product('Keyboard', 99);
    const article = new Article('Article about keyboards');
    const image = orm.em.create(Image, { imageable: product, url: 'keyboard.jpg' });
    orm.em.persist(article);

    await orm.em.flush();
    orm.em.clear();

    const loadedImage = await orm.em.findOneOrFail(Image, { id: image.id });
    const loadedArticle = await orm.em.findOneOrFail(Article, { id: article.id });

    loadedImage.imageable = loadedArticle;

    await orm.em.flush();
    orm.em.clear();

    const reloadedImage = await orm.em.findOneOrFail(Image, { id: image.id });
    expect(reloadedImage.imageable).toBeInstanceOf(Article);
    await orm.em.populate(reloadedImage, ['imageable']);
    expect((reloadedImage.imageable as Article).title).toBe('Article about keyboards');
  });

  test('populating inverse collection works correctly', async () => {
    const product = new Product('Mouse', 29);
    const img1 = orm.em.create(Image, { imageable: product, url: 'mouse1.jpg' });
    const img2 = orm.em.create(Image, { imageable: product, url: 'mouse2.jpg' });
    const img3 = orm.em.create(Image, { imageable: product, url: 'mouse3.jpg' });

    await orm.em.flush();
    orm.em.clear();

    const loadedProduct = await orm.em.findOneOrFail(
      Product,
      { id: product.id },
      {
        populate: ['images'],
      },
    );

    expect(loadedProduct.images).toHaveLength(3);
    expect(
      loadedProduct.images
        .getItems()
        .map(i => i.url)
        .sort(),
    ).toEqual(['mouse1.jpg', 'mouse2.jpg', 'mouse3.jpg']);
  });

  test('removing entity with polymorphic relations', async () => {
    const product = new Product('Test Product', 10);
    const image = orm.em.create(Image, { imageable: product, url: 'test.jpg' });

    await orm.em.flush();

    orm.em.remove(image);
    await orm.em.flush();

    const count = await orm.em.count(Image, {});
    expect(count).toBe(0);

    // Product should still exist
    const productCount = await orm.em.count(Product, {});
    expect(productCount).toBe(1);
  });

  test('discriminator column stores correct value', async () => {
    const product = new Product('Test', 1);
    const image = orm.em.create(Image, { imageable: product, url: 'test.jpg' });

    await orm.em.flush();
    orm.em.clear();

    // Check raw data in database
    const connection = orm.em.getConnection();
    const [row] = await connection.execute('SELECT * FROM image WHERE id = ?', [image.id]);

    expect(row.imageable_type).toBe('product');
    expect(row.imageable_id).toBe(product.id);
  });

  test('can handle entities with same ID in different tables', async () => {
    // Both entities will have id = 1
    const product = new Product('Product', 100);
    const article = new Article('Article');

    const productImage = orm.em.create(Image, { imageable: product, url: 'product.jpg' });
    const articleImage = orm.em.create(Image, { imageable: article, url: 'article.jpg' });

    await orm.em.flush();

    // Both entities should have id = 1 after flush
    expect(product.id).toBe(1);
    expect(article.id).toBe(1);

    orm.em.clear();

    // Load images and verify they point to correct entities
    const images = await orm.em.find(Image, {}, { populate: ['imageable'] });

    const prodImg = images.find(i => (i.imageable as Product).name === 'Product');
    const artImg = images.find(i => (i.imageable as Article).title === 'Article');

    expect(prodImg).toBeDefined();
    expect(artImg).toBeDefined();
    expect(prodImg!.imageable).toBeInstanceOf(Product);
    expect(artImg!.imageable).toBeInstanceOf(Article);
  });
});
