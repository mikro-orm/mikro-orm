import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { MikroORM } from '@mikro-orm/pglite';
import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';

@Entity()
class User {
  @PrimaryKey({ type: 'number' })
  id!: number;

  @Property({ type: 'string' })
  name!: string;
}

describe('GH #7852 — named databases inside a pglite cluster', () => {
  let dataDir: string;

  beforeEach(() => {
    dataDir = mkdtempSync(join(tmpdir(), 'pglite-cluster-'));
  });

  afterEach(() => {
    rmSync(dataDir, { recursive: true, force: true });
  });

  test('dbName selects a named database in the cluster (driverOptions.dataDir set), creates and persists it', async () => {
    const init = () =>
      MikroORM.init({
        entities: [User],
        dbName: 'app',
        driverOptions: { dataDir },
      });

    const orm = await init();
    await orm.schema.refresh();

    // the named database is the active one
    const [{ db }] = await orm.em.getConnection().execute<{ db: string }[]>('select current_database() as db');
    expect(db).toBe('app');

    orm.em.create(User, { name: 'Foo' });
    await orm.em.flush();
    await orm.close();

    // reopen the same cluster + database, data persisted
    const orm2 = await init();
    const user = await orm2.em.findOneOrFail(User, { name: 'Foo' });
    expect(user.name).toBe('Foo');
    await orm2.close();

    // the default `postgres` database in the same cluster is untouched (isolation)
    const ormDefault = await MikroORM.init({
      entities: [User],
      dbName: 'postgres',
      driverOptions: { dataDir },
    });
    const hasUser = await ormDefault.em
      .getConnection()
      .execute<{ t: string | null }[]>(`select to_regclass('public."user"') as t`);
    expect(hasUser[0].t).toBeNull();
    await ormDefault.close();
  });

  test('ensureDatabase creates the named database and is idempotent, dropDatabase removes it', async () => {
    const orm = await MikroORM.init({
      entities: [User],
      dbName: 'mydb',
      driverOptions: { dataDir },
    });

    expect(await orm.schema.ensureDatabase()).toBe(true);
    expect(await orm.schema.ensureDatabase({ forceCheck: true })).toBe(false);

    await orm.schema.dropDatabase('mydb');
    const dbs = await orm.em
      .getConnection()
      .execute<{ datname: string }[]>(`select datname from pg_database where datname = 'mydb'`);
    expect(dbs).toHaveLength(0);

    await orm.close();
  });
});
