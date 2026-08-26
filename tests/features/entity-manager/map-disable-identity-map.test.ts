import { defineEntity, MikroORM, p } from '@mikro-orm/sqlite';

const TagSchema = defineEntity({
  name: 'Tag',
  properties: {
    id: p.string().primary(),
  },
});

class Tag extends TagSchema.class {}
TagSchema.setClass(Tag);

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Tag],
    dbName: ':memory:',
  });
  await orm.schema.create();
});

afterAll(async () => {
  await orm.close(true);
});

test('em.map can bypass the identity map', () => {
  const em = orm.em.fork();
  const before = em.map(Tag, { id: '1' }, { disableIdentityMap: true });

  expect(before).toBeInstanceOf(Tag);
  expect(before.id).toBe('1');
  expect(em.getUnitOfWork().getIdentityMap().values()).toEqual([]);

  const after = em.map(Tag, { id: '1' });
  const isolated = em.getRepository(Tag).map({ id: '1' }, { disableIdentityMap: true });

  expect(after).not.toBe(before);
  expect(isolated).not.toBe(after);
  expect(isolated).not.toBe(before);
  expect(em.getUnitOfWork().getIdentityMap().values()).toEqual([after]);
  expect(em.map(Tag, { id: '1' })).toBe(after);
});

test('em.map respects the global identity map setting and local override', () => {
  const em = orm.em.fork();
  const previous = orm.config.get('disableIdentityMap');
  orm.config.set('disableIdentityMap', true);

  try {
    const first = em.map(Tag, { id: '1' });
    const second = em.map(Tag, { id: '1' });

    expect(second).not.toBe(first);
    expect(em.getUnitOfWork().getIdentityMap().values()).toEqual([]);

    const managed = em.map(Tag, { id: '1' }, { disableIdentityMap: false });

    expect(managed).not.toBe(first);
    expect(managed).not.toBe(second);
    expect(em.getUnitOfWork().getIdentityMap().values()).toEqual([managed]);
    expect(em.map(Tag, { id: '1' }, { disableIdentityMap: false })).toBe(managed);
  } finally {
    orm.config.set('disableIdentityMap', previous);
  }
});
