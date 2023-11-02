import { Cascade, Entity, MikroORM, OneToOne, PrimaryKey, Property, Rel, serialize } from '@mikro-orm/core';
import { BetterSqliteDriver } from '@mikro-orm/better-sqlite';

@Entity()
class ImageInfo {

  @PrimaryKey()
  id!: number;

  @Property()
  url!: string;

  @OneToOne(() => MainItem, image => image.coverImage)
  itemEntity?: Rel<MainItem>;

}

@Entity()
class MainItem {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @OneToOne(() => ImageInfo, image => image.itemEntity, { owner: true, orphanRemoval: true, cascade: [Cascade.PERSIST] })
  coverImage!: ImageInfo;

}

test('serialization of not managed relations (#3788)', async () => {
  await MikroORM.init({
    driver: BetterSqliteDriver,
    dbName: ':memory:',
    entities: [ImageInfo],
    connect: false,
  });

  const image = new ImageInfo();
  image.url = 'xxxx';
  const mainItem = new MainItem();
  mainItem.name = 'yyyy';
  mainItem.coverImage = image;
  expect(mainItem).toMatchObject({
    name: 'yyyy',
    coverImage: {
      url: 'xxxx',
      itemEntity: { name: 'yyyy', coverImage: { url: 'xxxx' } },
    },
  });
  expect(JSON.stringify(mainItem)).toBe(`{"name":"yyyy","coverImage":{"url":"xxxx","itemEntity":{"name":"yyyy"}}}`);
  expect(JSON.stringify(serialize(mainItem))).toBe(`{"name":"yyyy","coverImage":{"url":"xxxx","itemEntity":{"name":"yyyy"}}}`);
  expect(JSON.stringify(serialize(mainItem, { populate: ['coverImage'] }))).toBe(`{"name":"yyyy","coverImage":{"url":"xxxx","itemEntity":{"name":"yyyy"}}}`);
});
