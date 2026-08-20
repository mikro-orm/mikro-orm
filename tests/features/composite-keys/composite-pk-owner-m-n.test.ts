import { Collection, type EntityData, MikroORM, PrimaryKeyProp } from '@mikro-orm/sqlite';
import {
  Entity,
  ManyToMany,
  ManyToOne,
  PrimaryKey,
  Property,
  ReflectMetadataProvider,
} from '@mikro-orm/decorators/legacy';

@Entity()
class Tag {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;
}

@Entity()
class Param {
  [PrimaryKeyProp]?: ['bar', 'baz'];

  @PrimaryKey()
  bar!: number;

  @PrimaryKey()
  baz!: number;

  @Property({ nullable: true })
  name?: string;

  @ManyToMany(() => Tag)
  tags = new Collection<Tag>(this);
}

// composite PK built from a relation to another composite PK entity, so the pivot columns
// only line up when the owner PKs are flattened all the way down
@Entity()
class NestedParam {
  [PrimaryKeyProp]?: ['param', 'qux'];

  @ManyToOne(() => Param, { joinColumns: ['param_bar', 'param_baz'], primary: true })
  param!: Param;

  @PrimaryKey()
  qux!: number;

  @ManyToMany(() => Tag)
  tags = new Collection<Tag>(this);
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Param, NestedParam, Tag],
    dbName: ':memory:',
    metadataProvider: ReflectMetadataProvider,
  });
  await orm.schema.refresh();
});

afterAll(async () => {
  await orm.close(true);
});

test('insert with composite PK owner and non-empty M:N collection', async () => {
  const em = orm.em.fork();
  await em.insert(Tag, { id: 10, name: 't1' });
  await em.insert(Tag, { id: 11, name: 't2' });
  await em.insert(Param, { bar: 1, baz: 2, tags: [10, 11] });

  const param = await em.fork().findOneOrFail(Param, { bar: 1, baz: 2 }, { populate: ['tags'] });
  expect(param.tags.getIdentifiers()).toEqual([10, 11]);
});

test('insertMany with composite PK owner and non-empty M:N collection', async () => {
  const em = orm.em.fork();
  await em.insertMany(Tag, [
    { id: 20, name: 't3' },
    { id: 21, name: 't4' },
  ]);
  await em.insertMany(Param, [
    { bar: 3, baz: 4, tags: [20] },
    { bar: 5, baz: 6, tags: [20, 21] },
  ]);

  const params = await em.fork().find(Param, { bar: { $in: [3, 5] } }, { populate: ['tags'], orderBy: { bar: 'asc' } });
  expect(params.map(p => p.tags.getIdentifiers())).toEqual([[20], [20, 21]]);
});

test('update with composite PK owner and non-empty M:N collection', async () => {
  const em = orm.em.fork();
  await em.insert(Tag, { id: 30, name: 't5' });
  await em.insert(Param, { bar: 7, baz: 8 });
  await em.nativeUpdate(Param, { bar: 7, baz: 8 }, { tags: [30] });

  const param = await em.fork().findOneOrFail(Param, { bar: 7, baz: 8 }, { populate: ['tags'] });
  expect(param.tags.getIdentifiers()).toEqual([30]);
});

test('batch update with composite PK owner and non-empty M:N collection', async () => {
  const em = orm.em.fork();
  await em.insertMany(Tag, [
    { id: 50, name: 't7' },
    { id: 51, name: 't8' },
  ]);
  await em.insertMany(Param, [
    { bar: 12, baz: 13 },
    { bar: 14, baz: 15 },
  ]);
  await em.getDriver().nativeUpdateMany(
    Param,
    [
      { bar: 12, baz: 13 },
      { bar: 14, baz: 15 },
    ],
    [
      { name: 'p1', tags: [50] },
      { name: 'p2', tags: [51] },
    ] as EntityData<Param>[],
  );

  const params = await em
    .fork()
    .find(Param, { bar: { $in: [12, 14] } }, { populate: ['tags'], orderBy: { bar: 'asc' } });
  expect(params.map(p => p.tags.getIdentifiers())).toEqual([[50], [51]]);
});

test('insert with nested composite PK owner and non-empty M:N collection', async () => {
  const em = orm.em.fork();
  await em.insertMany(Tag, [
    { id: 40, name: 't6' },
    { id: 41, name: 't9' },
  ]);
  await em.insert(Param, { bar: 9, baz: 10 });
  await em.insert(NestedParam, { param: [9, 10], qux: 11, tags: [40] });
  await em.insert(NestedParam, { param: [9, 10], qux: 12, tags: [41] });

  const rows = await em.getConnection().execute('select * from nested_param_tags order by nested_param_qux');
  expect(rows).toEqual([
    { nested_param_param_bar: 9, nested_param_param_baz: 10, nested_param_qux: 11, tag_id: 40 },
    { nested_param_param_bar: 9, nested_param_param_baz: 10, nested_param_qux: 12, tag_id: 41 },
  ]);

  const np = await em.fork().findOneOrFail(NestedParam, { param: [9, 10], qux: 11 }, { populate: ['tags'] });
  expect(np.tags.getIdentifiers()).toEqual([40]);

  const nps = await em.fork().find(NestedParam, { param: [9, 10] }, { populate: ['tags'], orderBy: { qux: 'asc' } });
  expect(nps.map(n => n.tags.getIdentifiers())).toEqual([[40], [41]]);
});
