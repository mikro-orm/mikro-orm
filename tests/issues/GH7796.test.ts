import { readFileSync } from 'node:fs';
import { rm } from 'node:fs/promises';
import { MikroORM } from '@mikro-orm/mysql';
import { Entity, Enum, ManyToOne, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { Migrator } from '@mikro-orm/migrations';
import { BASE_DIR } from '../bootstrap.js';

@Entity()
class Category7796 {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;
}

@Entity()
class Widget7796 {
  @PrimaryKey()
  id!: number;

  @Property({ columnType: 'timestamp', defaultRaw: 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @Property({
    columnType: 'timestamp',
    defaultRaw: 'CURRENT_TIMESTAMP',
    extra: 'ON UPDATE CURRENT_TIMESTAMP',
  })
  updatedAt!: Date;

  @Property({ columnType: 'text' })
  description!: string;

  @Enum({ items: () => ['small', 'medium', 'large'] })
  size!: 'small' | 'medium' | 'large';

  @Property({ columnType: 'decimal(10,2)', default: 0 })
  price: number = 0;

  @ManyToOne(() => Category7796, { deleteRule: 'cascade', updateRule: 'cascade' })
  category!: Category7796;
}

const PATH = BASE_DIR + '/../temp/migrations-gh7796';
const DB = 'mikro_orm_test_gh7796';

describe('GH #7796 — snapshot flip-flop between migration:create and migration:up on MySQL', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [Category7796, Widget7796],
      dbName: DB,
      port: 3308,
      user: 'root',
      migrations: { path: PATH, snapshot: true },
      extensions: [Migrator],
    });
    await rm(PATH, { recursive: true, force: true });
    await orm.schema.dropDatabase();
    await orm.schema.createDatabase(DB);
  });

  afterAll(async () => {
    await rm(PATH, { recursive: true, force: true });
    await orm.schema.dropDatabase();
    await orm.close(true);
  });

  test('snapshot from entity metadata matches snapshot from MySQL introspection', async () => {
    // initial create from entity metadata: writes .snapshot-<db>.json
    const initial = await orm.migrator.createInitial();
    expect(initial.diff.up.length).toBeGreaterThan(0);
    const createSnapshot = JSON.parse(readFileSync(PATH + '/.snapshot-' + DB + '.json', 'utf8'));

    // apply via the migrator (rewrites .snapshot-<db>.json from MySQL information_schema)
    await orm.migrator.up();
    const upSnapshot = JSON.parse(readFileSync(PATH + '/.snapshot-' + DB + '.json', 'utf8'));

    // both sources must produce the same snapshot — otherwise the file flip-flops
    expect(upSnapshot).toEqual(createSnapshot);

    // and the user-visible symptom: a second create against an untouched entity must be empty
    const second = await orm.migrator.create();
    if (second.fileName) {
      await rm(PATH + '/' + second.fileName, { force: true });
    }
    expect(second.diff).toEqual({ up: [], down: [] });
  });
});
