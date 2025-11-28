import { Collection, MikroORM } from '@mikro-orm/sqlite';

import { Entity, ManyToOne, OneToMany, OneToOne, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
@Entity()
class MediaSet {

  @PrimaryKey()
  id!: number;

  @OneToMany({
    entity: () => Media,
    mappedBy: media => media.set,
  })
  medias = new Collection<Media>(this);

}

@Entity()
class Media {

  @PrimaryKey()
  id!: number;

  @ManyToOne({
    entity: () => MediaSet,
    nullable: true,
    index: true,
  })
  set: MediaSet;

  @Property({ type: 'text' })
  url: string;

  constructor({ url, set }: { url: string; set: MediaSet}) {
    this.url = url;
    this.set = set;
  }

}

@Entity()
class Product {

  @PrimaryKey()
  id!: number;

  @OneToOne({
    entity: () => MediaSet,
  })
  imageList: MediaSet;

  constructor({ imageList }: { imageList: MediaSet }) {
    this.imageList = imageList;
  }

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: ':memory:',
    entities: [Product, MediaSet, Media],
  });
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

test('6097', async () => {
  const mediaSet = new MediaSet();
  mediaSet.medias.add(new Media({ url: 'test', set: mediaSet }));

  const product = new Product({ imageList: mediaSet });
  product.id = 0;

  orm.em.create(Product, product);
  await orm.em.flush();
  orm.em.clear();

  const currentProduct = await orm.em.findOneOrFail(Product, 0, {
    fields: ['id', 'imageList.id', 'imageList.medias.id', 'imageList.medias.url'],
  });
  expect(currentProduct.imageList.medias.count()).toBe(1);
  expect(currentProduct.imageList.medias[0].url).toBe('test');
});
