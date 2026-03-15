import { defineEntity, MikroORM, p, type Opt, type InferEntity } from '@mikro-orm/sqlite';
import { v7 } from 'uuid';
import { IsExact, assert } from 'conditional-type-checks';

// --- Issue (a): Property initializers for default values ---

const ItemSchema = defineEntity({
  name: 'Item7307',
  properties: {
    id: p.uuid().primary(),
    label: p.string(),
    createdAt: p.datetime(),
  },
});

class Item7307 extends ItemSchema.class {
  id = v7();
  createdAt = new Date();
}

ItemSchema.setClass(Item7307);

// --- Issue (c): nullable() vs strictNullable() ---

const ProfileSchema = defineEntity({
  name: 'Profile7307',
  properties: {
    id: p.integer().primary().autoincrement(),
    // nullable() produces T | null | undefined (backwards-compatible)
    nickname: p.string().nullable(),
    // strictNullable() produces T | null (no undefined)
    bio: p.string().strictNullable(),
    // strictNullable() with relations
    title: p.string().strictNullable(),
  },
});

type IProfile = InferEntity<typeof ProfileSchema>;

// nullable() keeps current behavior: T | null | undefined
assert<IsExact<IProfile['nickname'], string | null | undefined>>(true);

// strictNullable() produces T | null without | undefined
assert<IsExact<IProfile['bio'], string | null>>(true);
assert<IsExact<IProfile['bio'], string | null | undefined>>(false);

// strictNullable() still makes the property optional in em.create()
assert<IsExact<IProfile['title'], string | null>>(true);

// --- strictNullable with relations and other builders ---

const RelSchema = defineEntity({
  name: 'Rel7307',
  properties: {
    id: p.integer().primary().autoincrement(),
    // strictNullable with m:1 relation
    profile: () => p.manyToOne(ProfileSchema).strictNullable(),
    // strictNullable with formula (produces Opt)
    computed: () =>
      p
        .manyToOne(ProfileSchema)
        .formula(cols => cols.id)
        .strictNullable(),
  },
});

type IRel = InferEntity<typeof RelSchema>;

// m:1 strictNullable relation
assert<IsExact<IRel['profile'], IProfile | null>>(true);
assert<IsExact<IRel['profile'], IProfile | null | undefined>>(false);

// formula + strictNullable produces Opt<T> | null (not | undefined)
assert<IsExact<IRel['computed'], Opt<IProfile> | null>>(true);

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [ItemSchema, ProfileSchema, RelSchema],
    dbName: ':memory:',
  });
  await orm.schema.create();
});

afterAll(() => orm.close(true));

beforeEach(async () => {
  await orm.schema.clear();
});

describe('GH #7307', () => {
  test('(a) property initializers provide default values when using new', async () => {
    const item = new Item7307();
    item.label = 'test-item';

    expect(item.id).toBeDefined();
    expect(typeof item.id).toBe('string');
    expect(item.createdAt).toBeInstanceOf(Date);

    orm.em.persist(item);
    await orm.em.flush();
    orm.em.clear();

    const loaded = await orm.em.findOneOrFail(Item7307, item.id);
    expect(loaded.id).toBe(item.id);
    expect(loaded.label).toBe('test-item');
    expect(loaded.createdAt).toBeInstanceOf(Date);
  });

  test('(a) multiple entities with property initializers get unique ids', async () => {
    const item1 = new Item7307();
    item1.label = 'item-1';
    const item2 = new Item7307();
    item2.label = 'item-2';

    expect(item1.id).not.toBe(item2.id);

    orm.em.persist([item1, item2]);
    await orm.em.flush();
    orm.em.clear();

    const items = await orm.em.findAll(Item7307, { orderBy: { label: 'asc' } });
    expect(items).toHaveLength(2);
    expect(items[0].label).toBe('item-1');
    expect(items[1].label).toBe('item-2');
  });

  test('(c) strictNullable properties work at runtime', async () => {
    const profileNull = orm.em.create(ProfileSchema, {
      bio: null,
      title: null,
    });

    const profileWithValues = orm.em.create(ProfileSchema, {
      nickname: 'Nick',
      bio: 'A short bio',
      title: 'Mr',
    });

    await orm.em.flush();
    orm.em.clear();

    const loadedNull = await orm.em.findOneOrFail(ProfileSchema, profileNull.id);
    expect(loadedNull.nickname).toBeNull();
    expect(loadedNull.bio).toBeNull();
    expect(loadedNull.title).toBeNull();

    const loadedWithValues = await orm.em.findOneOrFail(ProfileSchema, profileWithValues.id);
    expect(loadedWithValues.nickname).toBe('Nick');
    expect(loadedWithValues.bio).toBe('A short bio');
    expect(loadedWithValues.title).toBe('Mr');
  });

  test('(c) strictNullable properties can be omitted in em.create()', async () => {
    const profile = orm.em.create(ProfileSchema, {});
    await orm.em.flush();
    orm.em.clear();

    const loaded = await orm.em.findOneOrFail(ProfileSchema, profile.id);
    expect(loaded.nickname).toBeNull();
    expect(loaded.bio).toBeNull();
  });

  test('(c) strictNullable properties can be updated from null to value and back', async () => {
    const profile = orm.em.create(ProfileSchema, {
      bio: 'Initial bio',
      title: 'Dr',
    });
    await orm.em.flush();

    profile.bio = null;
    profile.title = null;
    await orm.em.flush();
    orm.em.clear();

    const loadedNull = await orm.em.findOneOrFail(ProfileSchema, profile.id);
    expect(loadedNull.bio).toBeNull();
    expect(loadedNull.title).toBeNull();

    loadedNull.bio = 'Updated bio';
    loadedNull.title = 'Prof';
    await orm.em.flush();
    orm.em.clear();

    const loadedUpdated = await orm.em.findOneOrFail(ProfileSchema, profile.id);
    expect(loadedUpdated.bio).toBe('Updated bio');
    expect(loadedUpdated.title).toBe('Prof');
  });
});
