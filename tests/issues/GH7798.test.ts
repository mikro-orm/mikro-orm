import { readFileSync } from 'node:fs';
import { rm } from 'node:fs/promises';
import { MikroORM } from '@mikro-orm/sqlite';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { Migrator } from '@mikro-orm/migrations';
import { BASE_DIR } from '../bootstrap.js';

@Entity({ tableName: 'account7798', comment: 'accounts table' })
class Account7798 {
  @PrimaryKey()
  id!: number;

  @Property({ type: 'string', comment: 'free-form notes' })
  notes!: string;
}

const PATH = BASE_DIR + '/../temp/migrations-gh7798';

describe('GH #7798 — migrator.up() rewrites snapshot, dropping sqlite comments', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [Account7798],
      dbName: ':memory:',
      migrations: { path: PATH, snapshot: true },
      extensions: [Migrator],
    });
    await rm(PATH, { recursive: true, force: true });
  });

  afterAll(async () => {
    await rm(PATH, { recursive: true, force: true });
    await orm.close(true);
  });

  test('snapshot from entity metadata matches snapshot from sqlite introspection', async () => {
    const initial = await orm.migrator.createInitial();
    expect(initial.diff.up.length).toBeGreaterThan(0);
    const createSnapshot = JSON.parse(readFileSync(PATH + '/.snapshot-memory.json', 'utf8'));

    await orm.migrator.up();
    const upSnapshot = JSON.parse(readFileSync(PATH + '/.snapshot-memory.json', 'utf8'));

    // sqlite does not persist table/column comments, so `up()` must not flip the snapshot
    expect(upSnapshot).toEqual(createSnapshot);
    const account = upSnapshot.tables.find((t: any) => t.name === 'account7798');
    expect(account.comment).toBeNull();
    expect(account.columns.notes.comment).toBeNull();

    const second = await orm.migrator.create();
    if (second.fileName) {
      await rm(PATH + '/' + second.fileName, { force: true });
    }
    expect(second.diff).toEqual({ up: [], down: [] });
  });
});
