import { rm } from 'node:fs/promises';
import { EntitySchema, MikroORM } from '@mikro-orm/postgresql';
import { Migrator } from '@mikro-orm/migrations';

class Item {
  id!: number;
  value!: number;
}

const ItemSchema = new EntitySchema({
  class: Item,
  tableName: 'items',
  properties: {
    id: { type: 'number', primary: true },
    value: { type: 'number' },
  },
  triggers: [
    {
      name: 'items_increment_after_insert',
      timing: 'after',
      events: ['insert'],
      body: ['update items set value = value + 1 where id = NEW.id;', 'return NEW'].join('\n'),
    },
  ],
});

describe('GH8061', () => {
  let orm: MikroORM;
  const migrationPath = process.cwd() + '/temp/migrations-8061';

  beforeAll(async () => {
    await rm(migrationPath, { recursive: true, force: true });
    orm = await MikroORM.init({
      dbName: '8061',
      entities: [ItemSchema],
      extensions: [Migrator],
      migrations: { path: migrationPath, snapshot: false },
    });
    await orm.schema.refresh();
  });

  afterAll(async () => {
    await orm.close(true);
  });

  test('dollar-quoted trigger body is kept as a single statement', async () => {
    await orm.schema.drop();
    const migration = await orm.migrator.createInitial(migrationPath);
    const fnStatements = migration.diff.up.filter(sql => sql.includes('create or replace function'));
    expect(fnStatements).toHaveLength(1);
    expect(fnStatements[0]).toContain('language plpgsql');
    await orm.schema.refresh();
  });
});
