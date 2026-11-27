import { defineEntity, MikroORM, p, ref } from '@mikro-orm/sqlite';
import { mockLogger } from '../helpers.js';

function model(label: string, pk: () => any) {
  const User = defineEntity({
    name: `User${label}`,
    properties: {
      id: pk(),
      name: p.string(),
    },
  });

  const Bot = defineEntity({
    name: `Bot${label}`,
    properties: {
      id: pk(),
      name: p.string(),
    },
  });

  const Comment = defineEntity({
    name: `Comment${label}`,
    properties: {
      id: pk(),
      body: p.string(),
      author: () => p.manyToOne([User, Bot]).ref(),
    },
  });

  return { User, Bot, Comment };
}

const updateSql = (mock: ReturnType<typeof mockLogger>) =>
  mock.mock.calls.map(call => String(call[0]).toLowerCase()).filter(sql => sql.includes('update'));

async function init(entities: any[]) {
  const orm = await MikroORM.init({ entities, dbName: ':memory:' });
  await orm.schema.create();

  return orm;
}

describe.each([
  [
    'Uuid',
    () =>
      p
        .uuid()
        .primary()
        .onCreate(() => crypto.randomUUID()),
  ],
  ['Int', () => p.integer().primary()],
] as const)('GH #8832 polymorphic %s primary keys', (label, pk) => {
  let orm: MikroORM;
  const { User, Bot, Comment } = model(label, pk);

  beforeAll(async () => {
    orm = await init([User, Bot, Comment]);
  });

  afterAll(() => orm.close(true));

  beforeEach(() => orm.schema.clear());

  test('an unchanged relation is not written again', async () => {
    const em = orm.em.fork();
    const alice = em.create(User, { name: 'Alice' });
    em.create(Comment, { body: 'Hello', author: ref(alice) });
    await em.flush();

    const mock = mockLogger(orm);
    await em.flush();
    expect(updateSql(mock)).toEqual([]);

    const loaded = orm.em.fork();
    await loaded.findOneOrFail(Comment, { body: 'Hello' });
    mock.mockClear();
    await loaded.flush();
    expect(updateSql(mock)).toEqual([]);
  });

  test('changing the target is written', async () => {
    const em = orm.em.fork();
    const alice = em.create(User, { name: 'Alice' });
    const bob = em.create(User, { name: 'Bob' });
    const comment = em.create(Comment, { body: 'Hello', author: ref(alice) });
    await em.flush();

    comment.author = ref(bob);
    await em.flush();
    comment.author = ref(em.create(Bot, { name: 'Helper' }));
    await em.flush();

    const reloaded = await orm.em.fork().findOneOrFail(Comment, { body: 'Hello' }, { populate: ['author'] });
    expect(reloaded.author.$.name).toBe('Helper');
  });

  test.each(['select-in', 'joined'] as const)('loading with %s does not write the relation again', async strategy => {
    const em = orm.em.fork();
    em.create(Comment, { body: 'Hello', author: ref(em.create(User, { name: 'Alice' })) });
    await em.flush();

    const loaded = orm.em.fork();
    const comment = await loaded.findOneOrFail(Comment, { body: 'Hello' }, { populate: ['author'], strategy });
    expect(comment.author.$.name).toBe('Alice');

    const mock = mockLogger(orm);
    await loaded.flush();
    expect(updateSql(mock)).toEqual([]);
  });
});

test('GH #8832 a persisted bigint target change is written', async () => {
  const { User, Bot, Comment } = model('Bigint', () => p.bigint().primary());
  const orm = await init([User, Bot, Comment]);

  try {
    const em = orm.em.fork();
    const alice = em.create(User, { id: 1n, name: 'Alice' });
    const helperBot = em.create(Bot, { id: 1n, name: 'Helper' });
    const comment = em.create(Comment, { id: 1n, body: 'Hello', author: ref(alice) });
    await em.flush();

    const mock = mockLogger(orm);
    await em.flush();
    expect(updateSql(mock)).toEqual([]);

    comment.author = ref(helperBot);
    mock.mockClear();
    await em.flush();
    expect(updateSql(mock)).toHaveLength(1);

    const reloaded = await orm.em.fork().findOneOrFail(Comment, { body: 'Hello' });
    expect(reloaded.author.unwrap().constructor.name).toBe('BotBigint');
    expect(String(reloaded.author.id)).toBe('1');
  } finally {
    await orm.close(true);
  }
});

test('GH #8832 joined targetKey and composite targets stay clean', async () => {
  const Article = defineEntity({
    name: 'Article8832',
    properties: {
      id: p.integer().primary(),
      slug: p.string().unique(),
    },
  });
  const Video = defineEntity({
    name: 'Video8832',
    properties: {
      id: p.integer().primary(),
      slug: p.string().unique(),
    },
  });
  const Page = defineEntity({
    name: 'Page8832',
    properties: {
      site: p.integer().primary(),
      path: p.string().primary(),
    },
  });
  const Asset = defineEntity({
    name: 'Asset8832',
    properties: {
      site: p.integer().primary(),
      path: p.string().primary(),
    },
  });
  const Bookmark = defineEntity({
    name: 'Bookmark8832',
    properties: {
      id: p.integer().primary(),
      target: () => p.manyToOne([Article, Video]).targetKey('slug'),
    },
  });
  const Visit = defineEntity({
    name: 'Visit8832',
    properties: {
      id: p.integer().primary(),
      subject: () => p.manyToOne([Page, Asset]),
    },
  });

  const orm = await init([Article, Video, Page, Asset, Bookmark, Visit]);

  try {
    const em = orm.em.fork();
    const savedBookmark = em.create(Bookmark, { target: em.create(Video, { slug: 'vid' }) });
    const savedVisit = em.create(Visit, { subject: em.create(Page, { site: 1, path: '/home' }) });
    await em.flush();

    const loaded = orm.em.fork();
    const bookmark = await loaded.findOneOrFail(Bookmark, savedBookmark.id, {
      populate: ['target'],
      strategy: 'joined',
    });
    const visit = await loaded.findOneOrFail(Visit, savedVisit.id, { populate: ['subject'], strategy: 'joined' });
    expect(bookmark.target.slug).toBe('vid');
    expect(visit.subject.path).toBe('/home');

    const mock = mockLogger(orm);
    await loaded.flush();
    expect(updateSql(mock)).toEqual([]);
  } finally {
    await orm.close(true);
  }
});
