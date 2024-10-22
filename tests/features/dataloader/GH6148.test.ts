import { Collection, Entity, ManyToOne, MikroORM, OneToMany, PrimaryKey, Property, Ref } from '@mikro-orm/sqlite';

@Entity()
class Video {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @OneToMany(() => Category, category => category.video)
  categories = new Collection<Category>(this);

  @OneToMany(() => Image, image => image.video)
  images = new Collection<Image>(this);

}

@Entity()
class Category {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @ManyToOne(() => Video, { nullable: true, ref: true })
  video?: Ref<Video>;

  @OneToMany(() => Image, image => image.category)
  images = new Collection<Image>(this);

}

@Entity()
class Image {

  @PrimaryKey()
  id!: number;

  @Property()
  url!: string;

  @ManyToOne(() => Video, { nullable: true, ref: true })
  video?: Ref<Video>;

  @ManyToOne(() => Category, { nullable: true, ref: true })
  category?: Ref<Category>;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Video, Category],
    dbName: ':memory:',
    dataloader: true,
  });
  await orm.getSchemaGenerator().refreshDatabase();
});

afterAll(() => orm.close(true));

test('load with relation from different entities', async () => {
  const video = orm.em.create(Video, { name: 'video1', images: [{ url: '/image1' }] });
  const category = orm.em.create(Category, { name: 'category2', images: [{ url: '/image2' }] });
  await orm.em.flush();
  orm.em.clear();

  const v1 = await orm.em.findOneOrFail(Video, video.id);
  const c1 = await orm.em.findOneOrFail(Category, category.id);
  await Promise.all([
    v1.images.load(),
    c1.images.load(),
  ]);
  expect(v1.images).toHaveLength(1);
  expect(v1.images[0].url).toEqual('/image1');
  expect(c1.images).toHaveLength(1);
  expect(c1.images[0].url).toEqual('/image2');
});
