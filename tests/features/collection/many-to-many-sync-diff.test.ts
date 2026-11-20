import { BlobType, Collection, MikroORM, PrimaryKeyProp } from '@mikro-orm/sqlite';
import { Entity, ManyToMany, PrimaryKey, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { mockLogger } from '../../helpers.js';

@Entity()
class Tag {
  @PrimaryKey()
  id!: number;
}

@Entity()
class Label {
  @PrimaryKey()
  id!: string;
}

@Entity()
class Pair {
  [PrimaryKeyProp]?: ['a', 'b'];

  @PrimaryKey()
  a!: string;

  @PrimaryKey()
  b!: string;
}

@Entity()
class Bin {
  @PrimaryKey({ type: BlobType })
  id!: Buffer;
}

@Entity()
class Owner {
  @PrimaryKey()
  id!: number;

  @ManyToMany(() => Tag)
  tags = new Collection<Tag>(this);

  @ManyToMany(() => Label)
  labels = new Collection<Label>(this);

  @ManyToMany(() => Pair)
  pairs = new Collection<Pair>(this);

  @ManyToMany(() => Bin)
  bins = new Collection<Bin>(this);

  @ManyToMany({ entity: () => Tag, pivotTable: 'owner_ordered_tags', fixedOrder: true })
  orderedTags = new Collection<Tag>(this);
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [Owner, Tag, Label, Pair, Bin],
    dbName: ':memory:',
  });
  await orm.schema.create();
});

beforeEach(async () => {
  await orm.schema.clear();
  const em = orm.em.fork();
  const owner = em.create(Owner, { id: 1 });

  for (let i = 1; i <= 5; i++) {
    const tag = em.create(Tag, { id: i });
    em.create(Label, { id: String(i) });
    em.create(Label, { id: `${i}0` });
    em.create(Bin, { id: Buffer.from([i]) });

    if (i <= 3) {
      owner.tags.add(tag);
      owner.orderedTags.add(tag);
      owner.labels.add(em.getReference(Label, String(i)));
      owner.bins.add(em.getReference(Bin, Buffer.from([i])));
    }
  }

  // values that would collide if the tuple values were joined with a plain separator
  for (const [a, b] of [
    ['x:y', 'z'],
    ['x', 'y:z'],
    ['x', 'y'],
    ['xy', ''],
  ]) {
    em.create(Pair, { a, b });
  }

  owner.pairs.add(em.getReference(Pair, ['x:y', 'z']), em.getReference(Pair, ['x', 'y']));
  await em.flush();
});

afterAll(async () => {
  await orm.close(true);
});

async function pivotRows(table: string, columns: string) {
  return orm.em.getConnection().execute(`select ${columns} from ${table} order by ${columns}`);
}

function pivotQueries(mock: ReturnType<typeof mockLogger>) {
  return mock.mock.calls
    .map(c => c[0] as string)
    .filter(sql => /insert into|delete from/.test(sql))
    .map(sql =>
      sql
        .replace(/\x1b\[\d+m/g, '')
        .replace(/^\[query] /, '')
        .replace(/ \[took .*$/, ''),
    );
}

test('only the changed items of a numeric M:N are written', async () => {
  const em = orm.em.fork();
  const owner = await em.findOneOrFail(Owner, 1, { populate: ['tags'] });
  owner.tags.remove(em.getReference(Tag, 2));
  owner.tags.add(em.getReference(Tag, 4), em.getReference(Tag, 5));

  const mock = mockLogger(orm);
  await em.flush();
  expect(pivotQueries(mock)).toEqual([
    'delete from `owner_tags` where `tag_id` = 2 and `owner_id` = 1',
    'insert into `owner_tags` (`tag_id`, `owner_id`) values (4, 1), (5, 1)',
  ]);
  expect(await pivotRows('owner_tags', 'owner_id, tag_id')).toEqual([
    { owner_id: 1, tag_id: 1 },
    { owner_id: 1, tag_id: 3 },
    { owner_id: 1, tag_id: 4 },
    { owner_id: 1, tag_id: 5 },
  ]);
});

test('set() with the same items writes nothing', async () => {
  const em = orm.em.fork();
  const owner = await em.findOneOrFail(Owner, 1, { populate: ['tags', 'labels', 'pairs', 'bins'] });
  owner.tags.set([em.getReference(Tag, 3), em.getReference(Tag, 1), em.getReference(Tag, 2)]);
  owner.labels.set(owner.labels.getItems().slice().reverse());
  owner.pairs.set(owner.pairs.getItems().slice().reverse());
  owner.bins.set(owner.bins.getItems().slice().reverse());

  const mock = mockLogger(orm);
  await em.flush();
  expect(pivotQueries(mock)).toEqual([]);
});

test('string PKs that only differ by prefix are not mixed up', async () => {
  const em = orm.em.fork();
  const owner = await em.findOneOrFail(Owner, 1, { populate: ['labels'] });
  owner.labels.set([em.getReference(Label, '1'), em.getReference(Label, '10'), em.getReference(Label, '30')]);

  const mock = mockLogger(orm);
  await em.flush();
  expect(pivotQueries(mock)).toEqual([
    "delete from `owner_labels` where ((`label_id` = '2' and `owner_id` = 1) or (`label_id` = '3' and `owner_id` = 1))",
    "insert into `owner_labels` (`label_id`, `owner_id`) values ('10', 1), ('30', 1)",
  ]);
  expect(await pivotRows('owner_labels', 'owner_id, label_id')).toEqual([
    { owner_id: 1, label_id: '1' },
    { owner_id: 1, label_id: '10' },
    { owner_id: 1, label_id: '30' },
  ]);
});

test('composite PKs with separator-like values are not mixed up', async () => {
  const em = orm.em.fork();
  const owner = await em.findOneOrFail(Owner, 1, { populate: ['pairs'] });
  owner.pairs.set([em.getReference(Pair, ['x', 'y:z']), em.getReference(Pair, ['xy', ''])]);

  const mock = mockLogger(orm);
  await em.flush();
  expect(pivotQueries(mock)).toEqual([
    "delete from `owner_pairs` where ((`pair_a` = 'x' and `pair_b` = 'y' and `owner_id` = 1) or (`pair_a` = 'x:y' and `pair_b` = 'z' and `owner_id` = 1))",
    "insert into `owner_pairs` (`pair_a`, `pair_b`, `owner_id`) values ('x', 'y:z', 1), ('xy', '', 1)",
  ]);
  expect(await pivotRows('owner_pairs', 'owner_id, pair_a, pair_b')).toEqual([
    { owner_id: 1, pair_a: 'x', pair_b: 'y:z' },
    { owner_id: 1, pair_a: 'xy', pair_b: '' },
  ]);
});

test('Buffer PKs are compared by value', async () => {
  const em = orm.em.fork();
  const owner = await em.findOneOrFail(Owner, 1, { populate: ['bins'] });
  owner.bins.remove(owner.bins.getItems()[0]);
  owner.bins.add(em.getReference(Bin, Buffer.from([4])));

  const mock = mockLogger(orm);
  await em.flush();
  expect(pivotQueries(mock)).toEqual([
    "delete from `owner_bins` where `bin_id` = X'01' and `owner_id` = 1",
    "insert into `owner_bins` (`bin_id`, `owner_id`) values (X'04', 1)",
  ]);
  const rows = await pivotRows('owner_bins', 'owner_id, bin_id');
  expect(rows.map(r => [...r.bin_id])).toEqual([[2], [3], [4]]);
});

test('fixed order collection is rewritten when the order changes', async () => {
  const em = orm.em.fork();
  const owner = await em.findOneOrFail(Owner, 1, { populate: ['orderedTags'] });
  const [t1, t2, t3] = owner.orderedTags.getItems();
  owner.orderedTags.set([t3, t1, t2]);

  const mock = mockLogger(orm);
  await em.flush();
  expect(pivotQueries(mock)).toEqual([
    'delete from `owner_ordered_tags` where ((`tag_id` = 1 and `owner_id` = 1) or (`tag_id` = 2 and `owner_id` = 1) or (`tag_id` = 3 and `owner_id` = 1))',
    'insert into `owner_ordered_tags` (`tag_id`, `owner_id`) values (3, 1), (1, 1), (2, 1) returning `id`',
  ]);

  const check = await orm.em.fork().findOneOrFail(Owner, 1, { populate: ['orderedTags'] });
  expect(check.orderedTags.getIdentifiers()).toEqual([3, 1, 2]);
});

test('fixed order collection keeps the order when an item is added', async () => {
  const em = orm.em.fork();
  const owner = await em.findOneOrFail(Owner, 1, { populate: ['orderedTags'] });
  owner.orderedTags.add(em.getReference(Tag, 4));

  const mock = mockLogger(orm);
  await em.flush();
  expect(pivotQueries(mock)).toEqual([
    'delete from `owner_ordered_tags` where ((`tag_id` = 1 and `owner_id` = 1) or (`tag_id` = 2 and `owner_id` = 1) or (`tag_id` = 3 and `owner_id` = 1))',
    'insert into `owner_ordered_tags` (`tag_id`, `owner_id`) values (1, 1), (2, 1), (3, 1), (4, 1) returning `id`',
  ]);

  const check = await orm.em.fork().findOneOrFail(Owner, 1, { populate: ['orderedTags'] });
  expect(check.orderedTags.getIdentifiers()).toEqual([1, 2, 3, 4]);
});
