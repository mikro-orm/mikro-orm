import { defineEntity, EntityMetadata, MetadataStorage, p } from '@mikro-orm/core';
import { type InferKyselyTable, type Kysely, MikroORM } from '@mikro-orm/sqlite';
import { vi } from 'vitest';
import { MikroTransformer } from '../../packages/sql/src/plugin/transformer.js';

const Person = defineEntity({
  name: 'Person',
  properties: {
    id: p.integer().primary().autoincrement(),
    firstName: p.string(),
    lastName: p.string().nullable(),
  },
});

const Pet = defineEntity({
  name: 'Pet',
  properties: {
    id: p.integer().primary().autoincrement(),
    petName: p.string(),
    owner: p.manyToOne(Person),
  },
});

const Toy = defineEntity({
  name: 'Toy',
  properties: {
    id: p.integer().primary().autoincrement(),
    toyName: p.string(),
  },
});

// only used by the rediscovery test, which adds a property to it
const Tag = defineEntity({
  name: 'Tag',
  properties: {
    id: p.integer().primary().autoincrement(),
    label: p.string(),
  },
});

const naming = { columnNamingStrategy: 'property' } as const;

interface ColumnDB {
  person: InferKyselyTable<typeof Person>;
  pet: InferKyselyTable<typeof Pet>;
  toy: InferKyselyTable<typeof Toy>;
}

interface PropertyDB {
  person: InferKyselyTable<typeof Person, typeof naming>;
  pet: InferKyselyTable<typeof Pet, typeof naming>;
  toy: InferKyselyTable<typeof Toy, typeof naming>;
}

describe('kysely result mapping caches', () => {
  let orm: MikroORM;

  beforeEach(async () => {
    orm = await MikroORM.init({ entities: [Person, Pet], dbName: ':memory:' });
    await orm.schema.create();
    const kysely = orm.em.getKysely<ColumnDB>();
    await kysely.insertInto('person').values({ id: 1, first_name: 'John', last_name: 'Doe' }).execute();
    await kysely.insertInto('pet').values({ id: 1, pet_name: 'Rex', owner_id: 1 }).execute();
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await orm.close(true);
  });

  const kysely = () => orm.em.getKysely<PropertyDB>(naming);

  test('finds an entity discovered after the table names were first looked up', async () => {
    // looks `person` up by table name, which builds the table name index
    await expect(kysely().selectFrom('person').selectAll().execute()).resolves.toEqual([
      { id: 1, firstName: 'John', lastName: 'Doe' },
    ]);

    orm.discoverEntity(Toy);
    await orm.schema.update();
    await orm.em.getKysely<ColumnDB>().insertInto('toy').values({ id: 1, toy_name: 'Ball' }).execute();

    await expect(kysely().selectFrom('toy').selectAll().execute()).resolves.toEqual([{ id: 1, toyName: 'Ball' }]);
  });

  test('maps the same query shape the same way every time', async () => {
    const query = () =>
      kysely()
        .selectFrom('pet as p')
        .innerJoin('person as o', 'o.id', 'p.owner')
        .select(['p.petName', 'p.owner', 'o.firstName'])
        .execute();

    const buildFieldMap = vi.spyOn(MikroTransformer.prototype, 'buildGlobalFieldMap');
    const first = await query();
    expect(first).toEqual([{ petName: 'Rex', owner: 1, firstName: 'John' }]);
    await expect(query()).resolves.toEqual(first);
    expect(buildFieldMap).toHaveBeenCalledTimes(1);
  });

  test('does not reuse the mapping of an entity whose properties changed since', async () => {
    await expect(kysely().selectFrom('person').selectAll().execute()).resolves.toEqual([
      { id: 1, firstName: 'John', lastName: 'Doe' },
    ]);

    orm.getMetadata().get(Person).removeProperty('lastName');

    await expect(kysely().selectFrom('person').selectAll().execute()).resolves.toEqual([
      { id: 1, firstName: 'John', last_name: 'Doe' },
    ]);
  });

  test('does not reuse the mapping of an entity rediscovered with new properties', async () => {
    const db = () => kysely() as Kysely<any>;
    orm.discoverEntity(Tag);
    await orm.schema.update();
    await db().insertInto('tag').values({ id: 1, label: 'foo' }).execute();
    await expect(db().selectFrom('tag').selectAll().execute()).resolves.toEqual([{ id: 1, label: 'foo' }]);

    // the rediscovered metadata is a new object with the same `_id`, so the query shape stays the same
    Tag.addProperty('nickName' as any, 'string', { nullable: true });
    orm.discoverEntity(Tag, Tag);
    await orm.schema.update();
    await db().updateTable('tag').set({ nickName: 'bar' }).execute();

    await expect(db().selectFrom('tag').selectAll().execute()).resolves.toEqual([
      { id: 1, label: 'foo', nickName: 'bar' },
    ]);
  });

  test('keeps mapping results once more query shapes were seen than are kept', async () => {
    // every alias is a query shape of its own
    const aliased = kysely() as Kysely<any>;

    for (let i = 0; i <= 1000; i++) {
      await expect(aliased.selectFrom(`person as p${i}`).select(`p${i}.firstName`).execute()).resolves.toEqual([
        { firstName: 'John' },
      ]);
    }

    await expect(aliased.selectFrom('person as p0').select('p0.firstName').execute()).resolves.toEqual([
      { firstName: 'John' },
    ]);
  });
});

describe('MetadataStorage.getByTableName', () => {
  test('resolves a shared table to the entity registered first, until it is removed', () => {
    class Root {}
    class Child {}
    const storage = new MetadataStorage();
    const root = storage.set(Root, new EntityMetadata({ class: Root, className: 'Root', tableName: 'root' }));
    const child = storage.set(Child, new EntityMetadata({ class: Child, className: 'Child', tableName: 'root' }));

    expect(storage.getByTableName('root')).toBe(root);
    expect(storage.getByTableName('child')).toBeUndefined();

    storage.reset(Root);
    expect(storage.getByTableName('root')).toBe(child);
  });
});
