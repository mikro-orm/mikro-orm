import { readFileSync } from 'node:fs';
import { rm } from 'node:fs/promises';
import { MikroORM } from '@mikro-orm/postgresql';
import {
  Check,
  Entity,
  Enum,
  Index,
  PrimaryKey,
  Property,
  ReflectMetadataProvider,
  Unique,
} from '@mikro-orm/decorators/legacy';
import { Migrator } from '@mikro-orm/migrations';
import { BASE_DIR } from '../bootstrap.js';

enum AccountStatus7798 {
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
}

@Entity({ tableName: 'account7798b' })
@Check({
  name: 'this_is_an_absurdly_long_check_constraint_name_to_trigger_postgres_truncation_7798',
  expression: 'balance >= 0',
})
@Index({
  name: 'account_data_gin_7798',
  properties: ['data'],
  type: 'gin',
})
class Account7798b {
  @PrimaryKey({ type: 'number' })
  id!: number;

  @Property({ type: 'number' })
  balance!: number;

  @Enum({ items: () => AccountStatus7798, nativeEnumName: 'account_status_7798' })
  status!: AccountStatus7798;

  @Property({ columnType: 'geometry(point, 4326)', type: 'string' })
  location!: string;

  @Property({ type: 'json' })
  data!: unknown;

  @Property({ type: 'Date', defaultRaw: 'current_timestamp' })
  createdAt!: Date;

  @Property({ type: 'number', columnType: 'integer', generated: '(coalesce(balance, 0) * 2) STORED' })
  doubled!: number;
}

@Entity({ tableName: 'order7798b' })
@Unique({
  name: 'order_pending_unique_ref_7798',
  properties: ['accountId', 'ref'],
  where: "status = 'PENDING'",
})
class Order7798b {
  @PrimaryKey({ type: 'number' })
  id!: number;

  @Property({ type: 'number' })
  accountId!: number;

  @Property({ type: 'string' })
  ref!: string;

  @Property({ type: 'string' })
  status!: string;
}

const PATH = BASE_DIR + '/../temp/migrations-gh7798b';
const DB = 'mikro_orm_test_gh7798b';

describe('GH #7798 — snapshot flip-flop between migration:create and migration:up on Postgres', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [Account7798b, Order7798b],
      dbName: DB,
      port: 5433,
      migrations: { path: PATH, snapshot: true },
      extensions: [Migrator],
    });
    await rm(PATH, { recursive: true, force: true });
    await orm.schema.dropDatabase();
    await orm.schema.createDatabase(DB);
    await orm.schema.execute('create extension if not exists postgis');
  });

  afterAll(async () => {
    await rm(PATH, { recursive: true, force: true });
    await orm.schema.dropDatabase();
    await orm.close(true);
  });

  test('migrator.up() does not rewrite a snapshot that matches the DB', async () => {
    const initial = await orm.migrator.createInitial();
    expect(initial.diff.up.length).toBeGreaterThan(0);
    const createSnapshot = JSON.parse(readFileSync(PATH + '/.snapshot-' + DB + '.json', 'utf8'));

    await orm.migrator.up();
    const upSnapshot = JSON.parse(readFileSync(PATH + '/.snapshot-' + DB + '.json', 'utf8'));

    // running migrations must not churn the snapshot when the DB still matches it
    expect(upSnapshot).toEqual(createSnapshot);

    const second = await orm.migrator.create();
    if (second.fileName) {
      await rm(PATH + '/' + second.fileName, { force: true });
    }
    expect(second.diff).toEqual({ up: [], down: [] });
  });
});
