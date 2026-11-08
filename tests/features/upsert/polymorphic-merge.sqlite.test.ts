import { defineEntity, MikroORM, p, PolymorphicRef } from '@mikro-orm/sqlite';

const Article = defineEntity({
  name: 'Article',
  properties: { id: p.integer().primary(), title: p.string() },
});

const Video = defineEntity({
  name: 'Video',
  properties: { id: p.integer().primary(), url: p.string() },
});

const Rating = defineEntity({
  name: 'Rating',
  properties: {
    id: p.integer().primary(),
    rateable: () => p.manyToOne([Article, Video]).discriminatorMap({ art: 'Article', vid: 'Video' }),
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({ entities: [Article, Video, Rating], dbName: ':memory:' });
  await orm.schema.refresh();
  await orm.em.insert(Article, { id: 1, title: 'a' });
  await orm.em.insert(Video, { id: 2, url: 'v' });
});

beforeEach(async () => {
  await orm.em.nativeDelete(Rating, {});
  await orm.em.insert(Rating, { id: 1, rateable: new PolymorphicRef('art', 1) as any });
});

afterAll(() => orm.close(true));

async function rateableOf(id: number) {
  const [row] = await orm.em.getConnection().execute('select * from rating where id = ?', [id]);
  return [row.rateable_type, row.rateable_id];
}

test('qb.merge() with a PolymorphicRef value writes the discriminator and the id', async () => {
  await orm.em
    .fork()
    .createQueryBuilder(Rating)
    .insert({ id: 1, rateable: new PolymorphicRef('vid', 2) as any })
    .onConflict('id')
    .merge({ rateable: new PolymorphicRef('vid', 2) as any })
    .execute();
  expect(await rateableOf(1)).toEqual(['vid', 2]);
});

test('qb.merge() with a polymorphic tuple value', async () => {
  await orm.em
    .fork()
    .createQueryBuilder(Rating)
    .insert({ id: 1, rateable: ['vid', 2] as any })
    .onConflict('id')
    .merge({ rateable: ['vid', 2] as any })
    .execute();
  expect(await rateableOf(1)).toEqual(['vid', 2]);
});
