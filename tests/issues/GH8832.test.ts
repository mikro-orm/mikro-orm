import { defineEntity, MikroORM, p, ref } from '@mikro-orm/sqlite';
import { v4 } from 'uuid';
import { mockLogger } from '../helpers.js';

const User = defineEntity({
  name: 'User',
  properties: {
    id: p.uuid().primary(),
    name: p.string(),
  },
});

const Team = defineEntity({
  name: 'Team',
  properties: {
    id: p.uuid().primary(),
    name: p.string(),
  },
});

const Comment = defineEntity({
  name: 'Comment',
  properties: {
    id: p.uuid().primary(),
    author: () => p.manyToOne([User, Team]),
  },
});

const Account = defineEntity({
  name: 'Account',
  properties: {
    id: p.integer().primary(),
    name: p.string().unique(),
  },
});

const Group = defineEntity({
  name: 'Group',
  properties: {
    id: p.integer().primary(),
    name: p.string().unique(),
  },
});

const Note = defineEntity({
  name: 'Note',
  properties: {
    id: p.integer().primary(),
    owner: () => p.manyToOne([Account, Group]),
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

const Visit = defineEntity({
  name: 'Visit',
  properties: {
    id: p.integer().primary(),
    subject: () => p.manyToOne([Page, Asset]),
  },
});

const Bookmark = defineEntity({
  name: 'Bookmark',
  properties: {
    id: p.integer().primary(),
    target: () => p.manyToOne([Account, Group]).targetKey('name'),
  },
});

let orm: MikroORM;

const ids = { user: v4(), user2: v4(), team: v4(), comment: v4() };

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [User, Team, Comment, Account, Group, Note, Page, Asset, Visit, Bookmark],
    dbName: ':memory:',
  });
  await orm.schema.create();
});

beforeEach(async () => {
  await orm.schema.clear();
  const user = orm.em.create(User, { id: ids.user, name: 'u1' });
  orm.em.create(User, { id: ids.user2, name: 'u2' });
  orm.em.create(Team, { id: ids.team, name: 't1' });
  orm.em.create(Comment, { id: ids.comment, author: user });
  const account = orm.em.create(Account, { id: 1, name: 'a1' });
  orm.em.create(Note, { id: 1, owner: account });
  orm.em.create(Bookmark, { id: 1, target: account });
  orm.em.create(Visit, { id: 1, subject: orm.em.create(Page, { site: 1, path: '/home' }) });
  await orm.em.flush();
  orm.em.clear();
});

afterAll(() => orm.close(true));

test('polymorphic relation with uuid PK targets is not updated after insert', async () => {
  const em = orm.em.fork();
  const user = em.create(User, { id: v4(), name: 'u3' });
  em.create(Comment, { id: v4(), author: user });
  await em.flush();

  const mock = mockLogger(orm);
  await em.flush();
  expect(mock).not.toHaveBeenCalled();
});

test.each([undefined, 'select-in', 'joined'] as const)(
  'polymorphic relation with uuid PK targets is not updated after load (populate: %s)',
  async strategy => {
    const em = orm.em.fork();
    await em.findOneOrFail(Comment, ids.comment, strategy ? { populate: ['author'], strategy } : {});

    const mock = mockLogger(orm);
    await em.flush();
    expect(mock).not.toHaveBeenCalled();
  },
);

test.each(['select-in', 'joined'] as const)(
  'polymorphic relation with integer PK targets is not updated after populated load (%s)',
  async strategy => {
    const em = orm.em.fork();
    await em.findOneOrFail(Note, 1, { populate: ['owner'], strategy });

    const mock = mockLogger(orm);
    await em.flush();
    expect(mock).not.toHaveBeenCalled();
  },
);

test.each(['select-in', 'joined'] as const)(
  'polymorphic relation with composite PK targets is not updated after populated load (%s)',
  async strategy => {
    const em = orm.em.fork();
    await em.findOneOrFail(Visit, 1, { populate: ['subject'], strategy });

    const mock = mockLogger(orm);
    await em.flush();
    expect(mock).not.toHaveBeenCalled();
  },
);

test.each(['select-in', 'joined'] as const)(
  'polymorphic targetKey relation is not updated after populated load (%s)',
  async strategy => {
    const em = orm.em.fork();
    await em.findOneOrFail(Bookmark, 1, { populate: ['target'], strategy });

    const mock = mockLogger(orm);
    await em.flush();
    expect(mock).not.toHaveBeenCalled();
  },
);

test('merging data with a wrapped reference in a polymorphic relation', async () => {
  const em = orm.em.fork();
  const account = await em.findOneOrFail(Account, 1);
  const note = em.merge(Note, { id: 1, owner: ref(account) });
  expect(note.owner).toBe(account);

  const mock = mockLogger(orm);
  await em.flush();
  expect(mock).not.toHaveBeenCalled();
});

test('changing the target of a polymorphic relation with uuid PK targets is persisted', async () => {
  const em = orm.em.fork();
  const comment = await em.findOneOrFail(Comment, ids.comment);
  comment.author = em.getReference(User, ids.user2);
  await em.flush();

  const c1 = await orm.em.fork().findOneOrFail(Comment, ids.comment, { populate: ['author'] });
  expect(c1.author).toMatchObject({ id: ids.user2, name: 'u2' });

  comment.author = em.getReference(Team, ids.team);
  await em.flush();

  const c2 = await orm.em.fork().findOneOrFail(Comment, ids.comment, { populate: ['author'] });
  expect(c2.author).toMatchObject({ id: ids.team, name: 't1' });
});
