import { defineEntity, MikroORM, p, SchemaComparator } from '@mikro-orm/sqlite';
import type { IndexDef } from '@mikro-orm/sql';

const makeIndex = (overrides: Partial<IndexDef> = {}): IndexDef => ({
  keyName: 'idx_device_position',
  columnNames: ['device_id', 'position'],
  unique: false,
  primary: false,
  constraint: false,
  ...overrides,
});

describe('index column options diffing', () => {
  let orm: MikroORM;
  let comparator: SchemaComparator;

  beforeAll(async () => {
    orm = await MikroORM.init({ dbName: ':memory:', entities: [], discovery: { warnWhenNoEntities: false } });
    comparator = new SchemaComparator(orm.em.getPlatform());
  });

  afterAll(() => orm.close(true));

  test('columns without options match an index without columns', () => {
    const declared = makeIndex({ columns: [{ name: 'device_id' }, { name: 'position' }] });
    expect(comparator.diffIndex(declared, makeIndex())).toBe(false);
  });

  test('explicit default options match an index without columns', () => {
    const declared = makeIndex({
      columns: [
        { name: 'device_id', sort: 'ASC' },
        { name: 'position', sort: 'asc' },
      ],
    });
    expect(comparator.diffIndex(declared, makeIndex())).toBe(false);
  });

  test('columns are matched by name, not by position', () => {
    // mssql introspection only reports the descending columns
    const declared = makeIndex({ columns: [{ name: 'device_id' }, { name: 'position', sort: 'DESC' }] });
    const introspected = makeIndex({ columns: [{ name: 'position', sort: 'DESC' }] });
    expect(comparator.diffIndex(declared, introspected)).toBe(false);
  });

  test('real option changes are still detected', () => {
    const plain = makeIndex();
    expect(comparator.diffIndex(makeIndex({ columns: [{ name: 'position', sort: 'DESC' }] }), plain)).toBe(true);
    expect(comparator.diffIndex(makeIndex({ columns: [{ name: 'device_id', length: 10 }] }), plain)).toBe(true);
    expect(comparator.diffIndex(makeIndex({ columns: [{ name: 'device_id', collation: 'NOCASE' }] }), plain)).toBe(
      true,
    );
    expect(comparator.diffIndex(makeIndex({ columns: [{ name: 'device_id', nulls: 'FIRST' }] }), plain)).toBe(true);
  });
});

class Location {
  id!: number;
  deviceId!: number;
  position!: number;
}

const LocationPlain = defineEntity({
  class: Location,
  tableName: 'idx_cols_location',
  indexes: [{ name: 'idx_cols_location_device_position', columns: [{ name: 'deviceId' }, { name: 'position' }] }],
  properties: {
    id: p.integer().primary(),
    deviceId: p.integer(),
    position: p.integer(),
  },
});

const LocationDesc = defineEntity({
  class: Location,
  tableName: 'idx_cols_location',
  indexes: [
    {
      name: 'idx_cols_location_device_position',
      columns: [{ name: 'deviceId' }, { name: 'position', sort: 'DESC' }],
    },
  ],
  properties: {
    id: p.integer().primary(),
    deviceId: p.integer(),
    position: p.integer(),
  },
});

describe('index declared with columns without options [sqlite]', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({ entities: [LocationPlain], dbName: ':memory:' });
    await orm.schema.refresh();
  });

  afterAll(() => orm.close(true));

  test('produces no diff once created', async () => {
    await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');
  });

  test('a sort change is still diffed', async () => {
    orm.discoverEntity(LocationDesc, LocationPlain);
    const diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatch(/drop index/i);
    expect(diff).toMatch(/`position` desc/i);
  });
});
