import { mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { MikroORM } from '@mikro-orm/sqlite';
import { Entity, PrimaryKey } from '@mikro-orm/decorators/legacy';
import { TEMP_DIR } from '../../helpers.js';

@Entity({ schema: 'billing' })
class Invoice {
  @PrimaryKey({ type: 'number' })
  id!: number;
}

@Entity({ schema: 'main' })
class WithMainSchema {
  @PrimaryKey({ type: 'number' })
  id!: number;
}

@Entity({ schema: '*' })
class WithWildcardSchema {
  @PrimaryKey({ type: 'number' })
  id!: number;
}

const error =
  "Entity Invoice declares schema 'billing', but SQLite cannot address it: attach it via `attachDatabases` or remove the schema in `discovery.onMetadata` when sharing entities between drivers";

test('schema without attachDatabases is rejected at init', async () => {
  await expect(MikroORM.init({ entities: [Invoice], dbName: ':memory:' })).rejects.toThrow(error);
});

test('schema not matching any attached database name is rejected at init', async () => {
  await expect(
    MikroORM.init({
      entities: [Invoice],
      dbName: ':memory:',
      attachDatabases: [{ name: 'accounting', path: ':memory:' }],
    }),
  ).rejects.toThrow(error);
});

test('main and wildcard schemas are accepted without attachDatabases', async () => {
  const orm = await MikroORM.init({ entities: [WithMainSchema, WithWildcardSchema], dbName: ':memory:' });
  await orm.schema.create();
  expect(await orm.schema.getUpdateSchemaSQL()).toBe('');
  await orm.close(true);
});

test('schema matching an attached database name is accepted', async () => {
  const dir = join(TEMP_DIR, 'schema-without-attach');
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const orm = await MikroORM.init({
    entities: [Invoice],
    dbName: join(dir, 'main.db'),
    attachDatabases: [{ name: 'billing', path: join(dir, 'billing.db') }],
  });
  await orm.schema.create();
  expect(await orm.schema.getUpdateSchemaSQL()).toBe('');
  await orm.close(true);
});

test('stripping the schema in discovery.onMetadata keeps shared entities working', async () => {
  const orm = await MikroORM.init({
    entities: [Invoice],
    dbName: ':memory:',
    discovery: {
      onMetadata(meta) {
        delete meta.schema;
      },
    },
  });
  await orm.schema.create();
  expect(await orm.schema.getUpdateSchemaSQL()).toBe('');
  await orm.close(true);
});
