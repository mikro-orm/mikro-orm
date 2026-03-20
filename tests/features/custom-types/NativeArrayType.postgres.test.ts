import { DecimalType, IntegerType, BooleanType, StringType, OptionalProps } from '@mikro-orm/postgresql';
import { MikroORM } from '@mikro-orm/postgresql';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { NativeArrayType } from '@mikro-orm/postgresql';
import { mockLogger } from '../../helpers.js';

@Entity()
class Product {
  @PrimaryKey()
  id!: number;

  @Property({ type: new NativeArrayType(new IntegerType()) })
  tagIds!: number[];

  @Property({ type: new NativeArrayType(new DecimalType('number')), precision: 10, scale: 2 })
  prices!: number[];

  @Property({ type: new NativeArrayType(new BooleanType()) })
  flags!: boolean[];

  @Property({ type: new NativeArrayType(new StringType()), nullable: true })
  labels?: string[] | null;

  [OptionalProps]?: 'labels';
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [Product],
    dbName: 'native_array_type',
  });
  await orm.schema.refresh();
});

afterAll(() => orm.close(true));

test('getColumnType produces typed array columns', async () => {
  const sql = await orm.schema.getCreateSchemaSQL();
  expect(sql).toMatch('"tag_ids" int[]');
  expect(sql).toMatch('"prices" numeric(10,2)[]');
  expect(sql).toMatch('"flags" boolean[]');
  expect(sql).toMatch('"labels" varchar(255)[]');
});

test('persist and retrieve entity with native array columns', async () => {
  const product = orm.em.create(Product, {
    id: 1,
    tagIds: [1, 2, 3],
    prices: [9.99, 19.99, 29.99],
    flags: [true, false, true],
    labels: ['foo', 'bar'],
  });
  await orm.em.flush();
  orm.em.clear();

  const found = await orm.em.findOneOrFail(Product, { id: 1 });
  expect(found.tagIds).toStrictEqual([1, 2, 3]);
  expect(found.prices).toStrictEqual([9.99, 19.99, 29.99]);
  expect(found.flags).toStrictEqual([true, false, true]);
  expect(found.labels).toStrictEqual(['foo', 'bar']);
});

test('nullable array column can store null', async () => {
  const product = orm.em.create(Product, {
    id: 2,
    tagIds: [],
    prices: [],
    flags: [],
    labels: null,
  });
  await orm.em.flush();
  orm.em.clear();

  const found = await orm.em.findOneOrFail(Product, { id: 2 });
  expect(found.labels).toBeNull();
});

test('empty arrays roundtrip correctly', async () => {
  const product = orm.em.create(Product, {
    id: 3,
    tagIds: [],
    prices: [],
    flags: [],
    labels: [],
  });
  await orm.em.flush();
  orm.em.clear();

  const found = await orm.em.findOneOrFail(Product, { id: 3 });
  expect(found.tagIds).toStrictEqual([]);
  expect(found.prices).toStrictEqual([]);
  expect(found.flags).toStrictEqual([]);
  expect(found.labels).toStrictEqual([]);
});

test('no spurious update after loading entity', async () => {
  const product = orm.em.create(Product, {
    id: 4,
    tagIds: [10, 20],
    prices: [1.5],
    flags: [false],
  });
  await orm.em.flush();
  orm.em.clear();

  await orm.em.findOneOrFail(Product, { id: 4 });
  const mock = mockLogger(orm);
  await orm.em.flush();
  expect(mock).not.toHaveBeenCalled();
});
