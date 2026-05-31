import { MikroORM } from '@mikro-orm/postgresql';
import { Entity, Enum, PrimaryKey, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

// A native enum that currently has no members (e.g. every value was removed
// over the project's lifetime, leaving `create type "task_kind" as enum ();`).
const TaskKind = {} as const;
type TaskKind = (typeof TaskKind)[keyof typeof TaskKind];

@Entity({ tableName: 'task' })
class Task {
  @PrimaryKey()
  id!: number;

  @Enum({ items: () => TaskKind, nativeEnumName: 'task_kind' })
  kind!: TaskKind;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [Task],
    dbName: '7825',
  });

  await orm.schema.ensureDatabase();
  await orm.schema.execute(`drop type if exists task_kind cascade`);
  await orm.schema.execute(`drop table if exists task`);
});

afterAll(() => orm.close());

test('GH #7825 — empty native enum is introspected and does not cause spurious create type', async () => {
  await orm.schema.execute(await orm.schema.getCreateSchemaSQL());

  const diff = await orm.schema.getUpdateSchemaSQL();
  expect(diff).toBe('');
});
