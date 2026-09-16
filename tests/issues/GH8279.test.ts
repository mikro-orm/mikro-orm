import { readFileSync } from 'node:fs';
import { rm } from 'node:fs/promises';
import { Entity, Index, MikroORM, PrimaryKey, Property } from '@mikro-orm/postgresql';
import { Migrator } from '@mikro-orm/migrations';
import { BASE_DIR } from '../helpers';

@Entity()
class Place8279 {

  @PrimaryKey()
  id!: number;

  @Property({ type: 'string', columnType: 'geometry(Point, 4326)', nullable: true })
  location?: string;

  @Property({ type: 'string', columnType: 'geography(Point, 4326)', nullable: true })
  geo?: string;

  @Index({ type: 'gin' })
  @Property({ type: 'json', nullable: true })
  data?: object;

  @Property({ defaultRaw: 'current_timestamp' })
  createdAt!: Date;

}

const path = BASE_DIR + '/../temp/migrations-gh8279';
const dbName = 'mikro_orm_test_gh8279';
const snapshotPath = path + '/.snapshot-' + dbName + '.json';

describe('GH #8279: backport PostGIS type comparison and snapshot preservation', () => {

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Place8279],
      dbName,
      port: 5433,
      logger: () => void 0,
      migrations: { path, snapshot: true },
      extensions: [Migrator],
    });
    await orm.schema.execute('create extension if not exists postgis');
  });

  beforeEach(async () => {
    await rm(path, { recursive: true, force: true });
    await orm.schema.dropSchema({ dropMigrationsTable: true });
  });

  afterAll(async () => {
    await orm.schema.dropDatabase();
    await orm.close(true);
    await rm(path, { recursive: true, force: true });
  });

  test('spatial modifiers and declaration whitespace round-trip without a schema diff', async () => {
    await orm.schema.createSchema();
    expect(await orm.schema.getUpdateSchemaSQL()).toBe('');
  });

  test.each([
    ['location', 'geometry(Point,3857)', 'geometry(Point, 4326)'],
    ['location', 'geometry(LineString,4326)', 'geometry(Point, 4326)'],
    ['location', 'geometry(PointZ,4326)', 'geometry(Point, 4326)'],
    ['geo', 'geography(Point,4269)', 'geography(Point, 4326)'],
    ['geo', 'geography(LineString,4326)', 'geography(Point, 4326)'],
    ['geo', 'geometry(Point,4326)', 'geography(Point, 4326)'],
  ])('detects a real change to %s as %s', async (column, type, targetType) => {
    await orm.schema.createSchema();
    await orm.schema.execute(`alter table "place8279" alter column "${column}" type ${type} using ("${column}"::${type})`);

    expect(await orm.schema.getUpdateSchemaSQL({ wrap: false })).toBe(
      `alter table "place8279" alter column "${column}" type ${targetType} using ("${column}"::${targetType});\n\n`,
    );
  });

  test('applying a migration preserves its snapshot and produces no follow-up migration', async () => {
    const migration = await orm.migrator.createMigration();
    expect(migration.diff.up.length).toBeGreaterThan(0);
    const snapshot = readFileSync(snapshotPath, 'utf8');

    await orm.migrator.up();

    expect(readFileSync(snapshotPath, 'utf8')).toBe(snapshot);
    expect(await orm.migrator.checkMigrationNeeded()).toBe(false);
    expect((await orm.migrator.createMigration()).diff).toEqual({ up: [], down: [] });

    // A real rollback must still replace the snapshot with the changed database schema.
    await orm.migrator.down();
    expect(readFileSync(snapshotPath, 'utf8')).not.toBe(snapshot);
    expect(await orm.migrator.checkMigrationNeeded()).toBe(true);
  });

});
