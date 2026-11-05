import { readdir, readFile, rm } from 'node:fs/promises';
import { defineEntity, MikroORM, p } from '@mikro-orm/postgresql';
import { Migrator } from '@mikro-orm/migrations';
import { TEMP_DIR } from '../../helpers.js';

const Measurement = defineEntity({
  name: 'Measurement',
  tableName: 'measurement',
  partitionBy: { type: 'hash', expression: 'id', partitions: 2 },
  properties: {
    id: p.integer().primary(),
    value: p.integer(),
  },
});

const Sale = defineEntity({
  name: 'Sale',
  tableName: 'sale',
  partitionBy: {
    type: 'list',
    expression: 'region',
    partitions: [{ name: 'sale_eu', values: "in ('eu')" }, { values: 'default' }],
  },
  properties: {
    id: p.integer().primary(),
    region: p.string().primary(),
  },
});

const path = TEMP_DIR + '/partitioning-snapshot-migrations';
let orm: MikroORM;

beforeEach(async () => {
  await rm(path, { recursive: true, force: true });
  orm = await MikroORM.init({
    entities: [Measurement, Sale],
    dbName: 'mikro_orm_test_partitioning_snapshot',
    extensions: [Migrator],
    migrations: { path, snapshot: true },
    logger: () => void 0,
  });
  await orm.schema.dropDatabase();
  await orm.schema.createDatabase();
});

afterEach(async () => {
  await orm.schema.dropDatabase();
  await orm.close(true);
});

afterAll(() => rm(path, { recursive: true, force: true }));

test('the schema snapshot keeps partitioning, so the next migration is empty', async () => {
  const first = await orm.migrator.create();
  expect(first.diff.up.join('\n')).toContain('partition by hash ("id")');

  const second = await orm.migrator.create();
  expect(second.diff.up).toEqual([]);

  const snapshotFile = (await readdir(path)).find(file => file.endsWith('.json'))!;
  const snapshot = JSON.parse(await readFile(`${path}/${snapshotFile}`, 'utf8'));
  expect(snapshot.tables.find((table: any) => table.name === 'measurement').partitioning).toMatchObject({
    definition: 'hash ("id")',
    partitions: [{ name: 'measurement_0' }, { name: 'measurement_1' }],
  });
});

test('no partitioned table is rebuilt when the snapshot is written from the database', async () => {
  await orm.migrator.create();
  // forces `up()` to write the snapshot from introspection instead of the entity metadata
  await rm(`${path}/${(await readdir(path)).find(file => file.endsWith('.json'))}`);
  await orm.migrator.up();

  const second = await orm.migrator.create();
  expect(second.diff.up).toEqual([]);
});
