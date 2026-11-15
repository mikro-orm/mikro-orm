import { defineEntity, MikroORM, p } from '@mikro-orm/sqlite';
import { mockLogger } from '../../helpers.js';

const Article = defineEntity({
  name: 'Article',
  properties: {
    id: p.integer().primary(),
    slug: p.string().unique(),
  },
});

const Video = defineEntity({
  name: 'Video',
  properties: {
    id: p.integer().primary(),
    slug: p.string().unique(),
  },
});

const Page = defineEntity({
  name: 'Page',
  properties: {
    site: p.integer().primary(),
    path: p.string().primary(),
  },
});

const Asset = defineEntity({
  name: 'Asset',
  properties: {
    site: p.integer().primary(),
    path: p.string().primary(),
  },
});

const Rating = defineEntity({
  name: 'Rating',
  properties: {
    id: p.integer().primary(),
    rateable: () => p.manyToOne([Article, Video]).discriminatorMap({ art: 'Article', vid: 'Video' }),
  },
});

const Bookmark = defineEntity({
  name: 'Bookmark',
  properties: {
    id: p.integer().primary(),
    target: () => p.manyToOne([Article, Video]).targetKey('slug').discriminatorMap({ art: 'Article', vid: 'Video' }),
  },
});

const Visit = defineEntity({
  name: 'Visit',
  properties: {
    id: p.integer().primary(),
    subject: () => p.manyToOne([Page, Asset]).discriminatorMap({ page: 'Page', asset: 'Asset' }),
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Article, Video, Page, Asset, Rating, Bookmark, Visit],
    dbName: ':memory:',
  });
  await orm.schema.create();

  const video = orm.em.create(Video, { id: 5, slug: 'vid-5' });
  orm.em.create(Rating, { id: 1, rateable: video });
  orm.em.create(Bookmark, { id: 1, target: video });
  orm.em.create(Visit, { id: 1, subject: orm.em.create(Page, { site: 1, path: '/home' }) });
  await orm.em.flush();
  orm.em.clear();
});

afterAll(() => orm.close(true));

test.each(['select-in', 'joined'] as const)(
  'merging a populated polymorphic many-to-one keeps the owner clean (%s)',
  async strategy => {
    const em = orm.em.fork();
    const rating = await em.findOneOrFail(Rating, 1, { fields: ['id'] });
    const ratings = await em.find(Rating, {}, { populate: ['rateable'], strategy });
    expect(ratings[0]).toBe(rating);

    const mock = mockLogger(orm);
    await em.flush();
    expect(mock).not.toHaveBeenCalled();
  },
);

test.each(['select-in', 'joined'] as const)(
  'merging a populated polymorphic targetKey many-to-one keeps the owner clean (%s)',
  async strategy => {
    const em = orm.em.fork();
    const bookmark = await em.findOneOrFail(Bookmark, 1, { fields: ['id'] });
    const bookmarks = await em.find(Bookmark, {}, { populate: ['target'], strategy });
    expect(bookmarks[0]).toBe(bookmark);

    const mock = mockLogger(orm);
    await em.flush();
    expect(mock).not.toHaveBeenCalled();
  },
);

test.each(['select-in', 'joined'] as const)(
  'merging a populated polymorphic many-to-one with a composite PK target keeps the owner clean (%s)',
  async strategy => {
    const em = orm.em.fork();
    const visit = await em.findOneOrFail(Visit, 1, { fields: ['id'] });
    const visits = await em.find(Visit, {}, { populate: ['subject'], strategy });
    expect(visits[0]).toBe(visit);

    const mock = mockLogger(orm);
    await em.flush();
    expect(mock).not.toHaveBeenCalled();
  },
);
