import { defineEntity, MikroORM, p, type Platform, Type, wrap } from '@mikro-orm/sqlite';

class UpperCaseType extends Type<string, string> {
  convertToDatabaseValue(value: string, platform: Platform): string {
    return value.toUpperCase();
  }

  convertToJSValue(value: string, platform: Platform): string {
    return value.toLowerCase();
  }

  getColumnType(): string {
    return 'text';
  }
}

class PrefixedType extends Type<string, string> {
  convertToDatabaseValue(value: string, platform: Platform): string {
    return `city:${value}`;
  }

  convertToJSValue(value: string, platform: Platform): string {
    return value.slice(5);
  }

  getColumnType(): string {
    return 'text';
  }
}

const Article = defineEntity({
  name: 'Article',
  properties: {
    id: p.integer().primary(),
    slug: p.string().unique(),
    title: p.string(),
  },
});

const Video = defineEntity({
  name: 'Video',
  properties: {
    id: p.integer().primary(),
    slug: p.string().unique(),
    url: p.string(),
  },
});

const Bookmark = defineEntity({
  name: 'Bookmark',
  properties: {
    id: p.integer().primary(),
    bookmarkable: () => p.manyToOne([Article, Video]).targetKey('slug'),
  },
});

const Country = defineEntity({
  name: 'Country',
  properties: {
    id: p.integer().primary(),
    code: p.type(UpperCaseType).unique(),
    name: p.string(),
  },
});

const City = defineEntity({
  name: 'City',
  properties: {
    id: p.integer().primary(),
    // same name as the target key of `country`, with a different custom type
    code: p.type(PrefixedType),
    country: () => p.manyToOne(Country).targetKey('code'),
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Article, Video, Bookmark, Country, City],
    dbName: ':memory:',
  });
  await orm.schema.refresh();

  const em = orm.em.fork();
  em.create(Bookmark, { bookmarkable: em.create(Video, { slug: 's1', url: 'v1' }) });
  // same slug on the first polymorphic target, only the discriminator tells them apart
  em.create(Article, { slug: 's1', title: 'A1' });
  em.create(City, { code: 'prg', country: em.create(Country, { code: 'cz', name: 'Czechia' }) });
  await em.flush();
});

afterAll(() => orm.close(true));

test.each(['select-in', 'joined', 'balanced'] as const)(
  'populating a polymorphic targetKey relation loads the target (%s)',
  async strategy => {
    const em = orm.em.fork();
    const [bookmark] = await em.find(Bookmark, {}, { populate: ['bookmarkable'], strategy });

    expect(bookmark.bookmarkable).not.toBeNull();
    expect((bookmark.bookmarkable as { url: string }).url).toBe('v1');
    expect(wrap(bookmark, true).__originalEntityData!.bookmarkable).not.toBeNull();
  },
);

test('targetKey with a custom type hydrates the key value', async () => {
  const em = orm.em.fork();
  const [city] = await em.find(City, {});

  expect(city.country.code).toBe('cz');
  expect(city.code).toBe('prg');
  const uow = em.getUnitOfWork();
  uow.computeChangeSets();
  expect(uow.getChangeSets()).toHaveLength(0);
});

test('targetKey custom type does not affect a same-named property of the owner', async () => {
  const em = orm.em.fork();
  const [city] = await em.find(City, {});
  city.code = 'brn';
  await em.flush();

  const raw = await orm.em.fork().getConnection().execute('select code, country_id from city');
  expect(raw[0]).toEqual({ code: 'city:brn', country_id: 'CZ' });
});

test('initializing a targetKey reference loads it by the key', async () => {
  const em = orm.em.fork();
  const [city] = await em.find(City, {});
  await wrap(city.country).init();

  expect(city.country.name).toBe('Czechia');
});
