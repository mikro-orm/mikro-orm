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
    const label = em.create(Label, { id: String(i) });
    em.create(Label, { id: `${i}0` });
    const pair = em.create(Pair, { a: 'x', b: String(i) });
    const bin = em.create(Bin, { id: Buffer.from([i]) });

    if (i <= 3) {
      owner.tags.add(tag);
      owner.labels.add(label);
      owner.pairs.add(pair);
      owner.bins.add(bin);
    }
  }

  await em.flush();
});

afterAll(async () => {
  await orm.close(true);
});

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

test('only the changed items of a M:N collection are written', async () => {
  const em = orm.em.fork();
  const owner = await em.findOneOrFail(Owner, 1, { populate: ['tags', 'labels', 'pairs', 'bins'] });
  owner.tags.remove(em.getReference(Tag, 2));
  owner.tags.add(em.getReference(Tag, 4));
  owner.labels.set([em.getReference(Label, '1'), em.getReference(Label, '10')]);
  owner.pairs.remove(em.getReference(Pair, ['x', '1']));
  owner.pairs.add(em.getReference(Pair, ['x', '4']));
  owner.bins.remove(owner.bins.getItems()[0]);
  owner.bins.add(em.getReference(Bin, Buffer.from([4])));

  const mock = mockLogger(orm);
  await em.flush();
  expect(pivotQueries(mock)).toEqual([
    'delete from `owner_tags` where `tag_id` = 2 and `owner_id` = 1',
    'insert into `owner_tags` (`tag_id`, `owner_id`) values (4, 1)',
    "delete from `owner_labels` where ((`label_id` = '2' and `owner_id` = 1) or (`label_id` = '3' and `owner_id` = 1))",
    "insert into `owner_labels` (`label_id`, `owner_id`) values ('10', 1)",
    "delete from `owner_pairs` where `pair_a` = 'x' and `pair_b` = '1' and `owner_id` = 1",
    "insert into `owner_pairs` (`pair_a`, `pair_b`, `owner_id`) values ('x', '4', 1)",
    "delete from `owner_bins` where `bin_id` = X'01' and `owner_id` = 1",
    "insert into `owner_bins` (`bin_id`, `owner_id`) values (X'04', 1)",
  ]);
});

test('set() with the same items in a different order writes nothing', async () => {
  const em = orm.em.fork();
  const owner = await em.findOneOrFail(Owner, 1, { populate: ['tags', 'labels', 'pairs', 'bins'] });

  for (const coll of [owner.tags, owner.labels, owner.pairs, owner.bins] as Collection<any>[]) {
    coll.set(coll.getItems().slice().reverse());
  }

  const mock = mockLogger(orm);
  await em.flush();
  expect(pivotQueries(mock)).toEqual([]);
});
