import { Collection, MikroORM, PrimaryKeyProp } from '@mikro-orm/oracledb';
import {
  Entity,
  ManyToMany,
  ManyToOne,
  PrimaryKey,
  Property,
  ReflectMetadataProvider,
} from '@mikro-orm/decorators/legacy';

@Entity()
class Owner {
  @PrimaryKey()
  id1!: number;

  @PrimaryKey()
  id2!: number;

  @Property()
  name!: string;

  @ManyToMany(() => Tag)
  tags = new Collection<Tag>(this);

  [PrimaryKeyProp]?: ['id1', 'id2'];
}

@Entity()
class Tag {
  @PrimaryKey()
  id!: number;

  @Property()
  label!: string;
}

@Entity()
class Pair {
  @ManyToOne(() => Owner, { primary: true })
  owner!: Owner;

  @ManyToOne(() => Tag, { primary: true })
  tag!: Tag;

  @Property()
  value!: string;

  [PrimaryKeyProp]?: ['owner', 'tag'];
}

@Entity()
class Note {
  @ManyToOne(() => Pair, { primary: true })
  pair!: Pair;

  @PrimaryKey()
  seq!: number;

  @Property()
  text!: string;

  [PrimaryKeyProp]?: ['pair', 'seq'];
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [Owner, Tag, Pair, Note],
    dbName: 'mikro_orm_test_composite_keys',
    password: 'oracle123',
    schemaGenerator: { managementDbName: 'system', tableSpace: 'mikro_orm' },
  });
  await orm.schema.refresh();
});

beforeEach(async () => {
  await orm.schema.clear();
  orm.em.clear();
});

afterAll(async () => {
  await orm.schema.drop({ wrap: false });
  await orm.close(true);
});

async function createPairs() {
  const o1 = orm.em.create(Owner, { id1: 1, id2: 10, name: 'o1' });
  const o2 = orm.em.create(Owner, { id1: 2, id2: 20, name: 'o2' });
  const t1 = orm.em.create(Tag, { id: 1, label: 't1' });
  const t2 = orm.em.create(Tag, { id: 2, label: 't2' });
  orm.em.create(Pair, { owner: o1, tag: t1, value: 'v1' });
  orm.em.create(Pair, { owner: o2, tag: t2, value: 'v2' });
  await orm.em.flush();
  orm.em.clear();
}

test('batch insert with a composite PK owner and non-empty M:N collection', async () => {
  await orm.em.insertMany(Tag, [
    { id: 1, label: 't1' },
    { id: 2, label: 't2' },
  ]);
  await orm.em.insertMany(Owner, [
    { id1: 1, id2: 10, name: 'o1', tags: [1] },
    { id1: 2, id2: 20, name: 'o2', tags: [1, 2] },
  ]);

  const owners = await orm.em.findAll(Owner, { populate: ['tags'], orderBy: { id1: 'asc' } });
  expect(owners.map(o => o.tags.getIdentifiers())).toEqual([[1], [1, 2]]);
});

// a primary relation to an entity with a composite PK spans several columns, so the
// `returning ... into` clause needs one OUT bind per column, not one per property
test('batch update with a primary relation pointing to an entity with a composite PK', async () => {
  await createPairs();

  const pairs = await orm.em.findAll(Pair, { orderBy: { owner: { id1: 'asc' } } });
  pairs[0].value = 'v1 updated';
  pairs[1].value = 'v2 updated';
  await orm.em.flush();
  orm.em.clear();

  const after = await orm.em.findAll(Pair, { orderBy: { owner: { id1: 'asc' } } });
  expect(after.map(p => [p.owner.id1, p.owner.id2, p.tag.id, p.value])).toEqual([
    [1, 10, 1, 'v1 updated'],
    [2, 20, 2, 'v2 updated'],
  ]);
});

// asserted on the driver result rather than on the entities - hydration resolves the relations
// through the identity map, which would mask values that came back with the wrong type
test('every returned column of a multi column primary relation round-trips', async () => {
  await createPairs();

  const res = await orm.em.getDriver().nativeUpdateMany(
    Pair,
    [
      { owner: [1, 10], tag: 1 },
      { owner: [2, 20], tag: 2 },
    ],
    [{ value: 'v1 updated' }, { value: 'v2 updated' }],
  );

  expect(res.rows).toEqual([
    { owner_id1: 1, owner_id2: 10, tag_id: 1 },
    { owner_id1: 2, owner_id2: 20, tag_id: 2 },
  ]);
});

// the target PK is itself made of relations, so the column types have to be resolved
// through both levels down to the scalar keys
test('every returned column of a nested composite primary relation round-trips', async () => {
  await createPairs();

  const pair = await orm.em.findOneOrFail(Pair, { owner: [1, 10], tag: 1 });
  orm.em.create(Note, { pair, seq: 1, text: 'n1' });
  orm.em.create(Note, { pair, seq: 2, text: 'n2' });
  await orm.em.flush();
  orm.em.clear();

  const res = await orm.em.getDriver().nativeUpdateMany(
    Note,
    [
      { pair: [[1, 10], 1], seq: 1 },
      { pair: [[1, 10], 1], seq: 2 },
    ],
    [{ text: 'n1 updated' }, { text: 'n2 updated' }],
  );

  expect(res.rows).toEqual([
    { pair_owner_id1: 1, pair_owner_id2: 10, pair_tag_id: 1, seq: 1 },
    { pair_owner_id1: 1, pair_owner_id2: 10, pair_tag_id: 1, seq: 2 },
  ]);
});
