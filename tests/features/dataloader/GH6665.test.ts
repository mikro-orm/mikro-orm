import {
  Collection,
  Entity,
  ManyToMany,
  ManyToOne,
  MikroORM,
  OneToMany,
  PrimaryKey,
  Property,
  Ref, SimpleLogger,
} from '@mikro-orm/sqlite';
import { mockLogger } from '../../helpers';

@Entity()
class Video {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @ManyToMany(() => Category)
  categories = new Collection<Category>(this);

  @ManyToMany(() => Category)
  categories2 = new Collection<Category>(this);

  @OneToMany(() => Image, image => image.video)
  images = new Collection<Image>(this);

  @OneToMany(() => Captions, captions => captions.video)
  captions = new Collection<Captions>(this);

}

@Entity()
class Category {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @ManyToMany(() => Video, video => video.categories)
  video = new Collection<Video>(this);

}

@Entity()
class Image {

  @PrimaryKey()
  id!: number;

  @Property()
  url!: string;

  @ManyToOne(() => Video, { nullable: true, ref: true })
  video?: Ref<Video>;

}

@Entity()
class Captions {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @ManyToOne(() => Video, { nullable: true, ref: true })
  video?: Ref<Video>;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Video, Category, Image],
    dbName: ':memory:',
    dataloader: true,
    loggerFactory: SimpleLogger.create,
  });
  await orm.getSchemaGenerator().refreshDatabase();
});

afterAll(() => orm.close(true));

test('load with empty m:n relations', async () => {
  const video = orm.em.create(Video, {
    name: 'video1',
    images: [{ url: '/image1' }],
  });
  await orm.em.flush();
  orm.em.clear();

  const mock = mockLogger(orm);

  // Load first non-empty 1:m relation, then empty 1:m relation
  const v1 = await orm.em.fork().findOneOrFail(Video, video.id);
  await Promise.all([v1.images.load(), v1.captions.load()]);
  expect(v1.images).toHaveLength(1);
  expect(v1.images[0].url).toEqual('/image1');
  expect(v1.captions).toHaveLength(0);

  // Switch the order of loading
  const v2 = await orm.em.fork().findOneOrFail(Video, video.id);
  await Promise.all([v2.captions.load(), v2.images.load()]);
  expect(v2.images).toHaveLength(1);
  expect(v2.images[0].url).toEqual('/image1');
  expect(v2.captions).toHaveLength(0);

  // Load 1:m first, then m:n
  const v3 = await orm.em.fork().findOneOrFail(Video, video.id);
  await Promise.all([v3.images.load(), v3.categories.load()]);
  expect(v3.images).toHaveLength(1);
  expect(v3.images[0].url).toEqual('/image1');
  expect(v3.categories).toHaveLength(0);

  // Load m:n first, then 1:m
  const v4 = await orm.em.fork().findOneOrFail(Video, video.id);
  await Promise.all([v4.categories.load(), v4.images.load()]);
  expect(v4.images).toHaveLength(1); // <--- v4.images is empty because dataloader makes an inner join with category table
  expect(v4.images[0].url).toEqual('/image1');
  expect(v4.categories).toHaveLength(0);

  // Load two different m:n
  const v5 = await orm.em.fork().findOneOrFail(Video, video.id);
  await Promise.all([v5.categories.load(), v5.categories2.load()]);
  expect(v5.categories).toHaveLength(0);
  expect(v5.categories2).toHaveLength(0);

  expect(mock.mock.calls).toMatchSnapshot();
});

test('load with non-empty m:n relations', async () => {
  const video = orm.em.create(Video, {
    name: 'video1',
    images: [{ url: '/image1' }],
    categories: [{ name: 'category1' }],
    captions: [{ name: 'caption1' }],
  });
  await orm.em.flush();
  orm.em.clear();

  const mock = mockLogger(orm);

  // Load 1:m relations
  const v1 = await orm.em.findOneOrFail(Video, video.id);
  await Promise.all([v1.images.load(), v1.captions.load()]);
  expect(v1.images).toHaveLength(1);
  expect(v1.images[0].url).toEqual('/image1');
  expect(v1.captions).toHaveLength(1);
  expect(v1.captions[0].name).toEqual('caption1');

  orm.em.clear();

  // Switch the order of loading
  const v2 = await orm.em.findOneOrFail(Video, video.id);
  await Promise.all([v2.captions.load(), v2.images.load()]);
  expect(v2.images).toHaveLength(1);
  expect(v2.images[0].url).toEqual('/image1');
  expect(v2.captions).toHaveLength(1);
  expect(v2.captions[0].name).toEqual('caption1');

  orm.em.clear();

  // Load 1:m first, then m:n
  const v3 = await orm.em.findOneOrFail(Video, video.id);
  await Promise.all([v3.images.load(), v3.categories.load()]);
  expect(v3.images).toHaveLength(1);
  expect(v3.images[0].url).toEqual('/image1');
  expect(v3.categories).toHaveLength(1);
  expect(v3.categories[0].name).toEqual('category1');

  orm.em.clear();

  // Load m:n first, then 1:m
  const v4 = await orm.em.findOneOrFail(Video, video.id);
  await Promise.all([v4.categories.load(), v4.images.load()]);
  expect(v4.images).toHaveLength(1);
  expect(v4.images[0].url).toEqual('/image1'); // <--- v4.images[0] is a category
  expect(v4.categories).toHaveLength(1);
  expect(v4.categories[0].name).toEqual('category1');

  expect(mock.mock.calls).toMatchSnapshot();
});
