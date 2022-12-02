import { Collection, Entity, ManyToMany, ManyToOne, MikroORM, PrimaryKey, Property } from '@mikro-orm/core';
import { SqliteDriver } from '@mikro-orm/sqlite';

@Entity({
  discriminatorColumn: 'role',
  discriminatorMap: {
    CREATOR: 'Creator',
  },
})
class User {

  @PrimaryKey()
  id!: number;

  @Property()
  role: 'CREATOR' = 'CREATOR' as const;

}

@Entity()
class Creator extends User {

  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  @ManyToMany({ entity: () => Task, pivotEntity: () => CreatorsOnTasks })
  tasks = new Collection<Task>(this);

}

@Entity()
class Task {

  @PrimaryKey()
  id!: number;

  @ManyToMany(() => Creator, c => c.tasks)
  creators = new Collection<Creator>(this);

}

@Entity()
class CreatorsOnTasks {

  @ManyToOne({ primary: true, entity: () => Creator })
  creator!: Creator;

  @ManyToOne({ primary: true, entity: () => Task })
  task!: Task;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [User, Creator, CreatorsOnTasks, Task],
    dbName: ':memory:',
    driver: SqliteDriver,
  });
  await orm.schema.createSchema();
});

afterAll(async () => await orm.close(true));

beforeEach(() => orm.schema.clearDatabase());

test('schema', async () => {
  const sql = await orm.schema.getCreateSchemaSQL();
  expect(sql).toMatchSnapshot();
});

async function createEntities() {
  const task = new Task();
  const creator = new Creator();
  task.creators.add(creator);
  await orm.em.fork().persistAndFlush(task);

  return { task };
}

test('should insert', async () => {
  await expect(createEntities()).resolves.not.toThrow();
});

test('should not findOne and populate m:n relation', async () => {
  const { task } = await createEntities();
  await expect(orm.em.findOne(Task, { id: task.id }, { populate: ['creators'] })).resolves.not.toThrow();
});
