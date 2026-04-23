import { Entity, Enum, PrimaryKey, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { EntitySchema, MikroORM } from '@mikro-orm/sqlite';

// Allow passing enum references directly instead of wrapping them in a callback
// (see comment on GH #7500).

enum Status {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
}

enum Priority {
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3,
}

@Entity()
class Task {
  @PrimaryKey()
  id!: number;

  @Enum({ items: Status })
  status!: Status;

  @Enum({ items: Priority })
  priority!: Priority;
}

interface ITaskSchema {
  id: number;
  status: Status;
  priority: Priority;
}

const TaskSchema = new EntitySchema<ITaskSchema>({
  name: 'TaskSchema',
  properties: {
    id: { type: Number, primary: true },
    status: { enum: true, items: Status },
    priority: { enum: true, items: Priority },
  },
});

test('decorator accepts enum reference directly via items', async () => {
  const orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [Task],
    dbName: ':memory:',
  });

  const meta = orm.getMetadata().get(Task);
  expect(meta.properties.status.items).toEqual(['active', 'inactive', 'pending']);
  expect(meta.properties.priority.items).toEqual([1, 2, 3]);

  await orm.schema.refresh();
  await orm.em.insertMany(Task, [{ status: Status.ACTIVE, priority: Priority.HIGH }]);
  const row = await orm.em.fork().findOneOrFail(Task, { status: Status.ACTIVE });
  expect(row.priority).toBe(Priority.HIGH);

  await orm.close(true);
});

test('EntitySchema accepts enum reference directly via items', async () => {
  const orm = await MikroORM.init({
    entities: [TaskSchema],
    dbName: ':memory:',
  });

  const meta = orm.getMetadata().get(TaskSchema);
  expect(meta.properties.status.items).toEqual(['active', 'inactive', 'pending']);
  expect(meta.properties.priority.items).toEqual([1, 2, 3]);

  await orm.close(true);
});
