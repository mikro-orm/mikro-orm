import {
  Collection,
  Entity,
  Enum,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryKey,
  Ref,
} from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/sqlite';
import { mockLogger } from '../helpers.js';

enum ImageType {
  COVER = 'cover',
  THUMBNAIL = 'thumbnail',
  ICON = 'icon',
}

@Entity()
class Image {

  @PrimaryKey()
  id!: number;

  @Enum(() => ImageType)
  type!: ImageType;

  @ManyToOne(() => Article, { ref: true })
  article!: Ref<Article>;

}

@Entity()
class Article {

  @PrimaryKey()
  id!: number;

  @OneToMany(() => Image, i => i.article, { orphanRemoval: true })
  images = new Collection<Image>(this);

  @OneToOne(() => Image, {
    formula: alias => {
      return `(select i.id from image i where i.type = '${ImageType.COVER}' and i.article_id = ${alias}.id)`;
    },
    ref: true,
    nullable: true,
  })
  cover?: Ref<Image>;

  @OneToOne(() => Image, {
    formula: alias => {
      return `(select i.id from image i where i.type = '${ImageType.THUMBNAIL}' and i.article_id = ${alias}.id)`;
    },
    nullable: true,
  })
  thumbnail?: Image;

  @OneToOne(() => Image, {
    formula: alias => {
      return `(select i.id from image i where i.type = '${ImageType.ICON}' and i.article_id = ${alias}.id)`;
    },
    nullable: true,
    mapToPk: true,
  })
  icon?: number;

}

let orm: MikroORM;
let article: Article;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [Image, Article],
  });

  await orm.schema.createSchema();
});

afterAll(async () => {
  await orm.close();
});

beforeEach(async () => {
  await orm.schema.clearDatabase();

  article = orm.em.create(Article, {
    images: [
      { id: 1, type: ImageType.ICON },
      { id: 2, type: ImageType.COVER },
      { id: 3, type: ImageType.THUMBNAIL },
    ],
  });

  await orm.em.flush();

  orm.em.clear();
});

test('removing from collection should not reinsert item when referenced by formula (ref)', async () => {
  const a = await orm.em.findOneOrFail(Article, article.id, {
    populate: ['images', 'cover'],
  });
  expect(a.images).toHaveLength(3);
  expect(a.cover?.id).toBe(2);
  a.images.removeAll();
  await orm.em.flush();
  expect(a.cover).toBeUndefined();
  const mock = mockLogger(orm);
  await orm.em.flush();
  expect(mock).not.toHaveBeenCalled();
});

test('removing from collection should not reinsert item when referenced by formula (without ref)', async () => {
  const a = await orm.em.findOneOrFail(Article, article.id, {
    populate: ['images', 'thumbnail'],
  });
  expect(a.images).toHaveLength(3);
  expect(a.thumbnail?.id).toBe(3);
  a.images.removeAll();
  await orm.em.flush();
  expect(a.thumbnail).toBeUndefined();
  const mock = mockLogger(orm);
  await orm.em.flush();
  expect(mock).not.toHaveBeenCalled();
});

test('removing from collection should not reinsert item when referenced by formula (mapToPk)', async () => {
  const a = await orm.em.findOneOrFail(Article, article.id, {
    populate: ['images', 'icon'],
  });
  expect(a.images).toHaveLength(3);
  expect(a.icon).toBe(1);
  a.images.removeAll();
  await orm.em.flush();
  expect(a.icon).toBeUndefined();
  const mock = mockLogger(orm);
  await orm.em.flush();
  expect(mock).not.toHaveBeenCalled();
});
