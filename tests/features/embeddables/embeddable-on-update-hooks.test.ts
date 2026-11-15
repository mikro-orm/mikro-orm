import { defineEntity, MikroORM, p } from '@mikro-orm/sqlite';

let counter = 0;
const calls: string[] = [];
const stamp = (label: string) => () => {
  calls.push(label);
  return `${label}-${++counter}`;
};

const Tag = defineEntity({
  embeddable: true,
  name: 'Tag',
  properties: {
    label: p.string(),
    touched: p.string().nullable().onUpdate(stamp('tag')),
  },
});

const Pet = defineEntity({
  abstract: true,
  discriminatorColumn: 'kind',
  embeddable: true,
  name: 'Pet',
  properties: {
    kind: p.string(),
    touched: p.string().nullable().onUpdate(stamp('pet')),
  },
});

const Cat = defineEntity({
  discriminatorValue: 'cat',
  embeddable: true,
  extends: Pet,
  name: 'Cat',
  properties: {
    lives: p.integer(),
  },
});

const Dog = defineEntity({
  discriminatorValue: 'dog',
  embeddable: true,
  extends: Pet,
  name: 'Dog',
  properties: {
    breed: p.string(),
  },
});

const Owner = defineEntity({
  name: 'Owner',
  properties: {
    id: p.integer().primary(),
    name: p.string(),
    touched: p.string().nullable().onUpdate(stamp('owner')),
    tags: () => p.embedded(Tag).array(),
    pet: () => p.embedded([Cat, Dog]).nullable(),
    petObject: () => p.embedded([Cat, Dog]).object().nullable(),
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = new MikroORM({
    dbName: ':memory:',
    entities: [Tag, Pet, Cat, Dog, Owner],
  });
  await orm.schema.create();
});

afterAll(() => orm.close(true));

test('onUpdate runs in array and polymorphic embeddables only when something else changed', async () => {
  const em = orm.em.fork();
  const owner = em.create(Owner, {
    id: 1,
    name: 'o',
    tags: [{ label: 'a' }, { label: 'b' }],
    pet: { kind: 'cat', lives: 9 } as any,
    petObject: { kind: 'dog', breed: 'pug' } as any,
  });
  await em.flush();
  calls.length = 0;

  await em.flush();
  expect(calls).toEqual([]);

  owner.name = 'o2';
  await em.flush();
  expect(calls).toEqual(['owner', 'tag', 'tag', 'pet', 'pet']);
  expect(owner.touched).toBe('owner-1');
  expect(owner.tags.map(t => t.touched)).toEqual(['tag-2', 'tag-3']);
  expect(owner.pet!.touched).toBe('pet-4');
  expect(owner.petObject!.touched).toBe('pet-5');

  const reloaded = await orm.em.fork().findOneOrFail(Owner, 1);
  expect(reloaded.touched).toBe('owner-1');
  expect(reloaded.tags.map(t => t.touched)).toEqual(['tag-2', 'tag-3']);
  expect(reloaded.pet).toMatchObject({ kind: 'cat', lives: 9, touched: 'pet-4' });
  expect(reloaded.petObject).toMatchObject({ kind: 'dog', breed: 'pug', touched: 'pet-5' });
});
