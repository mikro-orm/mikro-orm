import {
  Collection,
  Entity,
  EntityCaseNamingStrategy,
  ManyToMany,
  ManyToOne,
  MikroORM,
  PrimaryKey,
  Property,
} from '@mikro-orm/core';

@Entity({ abstract: true })
export abstract class AbstractEntity {

  @PrimaryKey()
  public id!: number;

}

@Entity({
  discriminatorColumn: 'role',
  discriminatorMap: {
    CREATOR: 'Creator',
  },
})
class User extends AbstractEntity {

  @Property({ default: 'CREATOR' })
  public role: 'CREATOR' = 'CREATOR' as const;

}

@Entity()
class Creator extends User {

  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  @ManyToMany({ entity: () => Task, pivotEntity: () => CreatorsOnTasks })
  public tasks = new Collection<Task>(this);

}

@Entity({ tableName: 'Task' })
class Task extends AbstractEntity {

  @ManyToMany(() => Creator, c => c.tasks)
  public creators = new Collection<Creator>(this);

}

@Entity({ tableName: 'CreatorsOnTasks' })
class CreatorsOnTasks {

  @ManyToOne({ primary: true, fieldName: 'creatorId', entity: () => Creator })
  public creator!: Creator;

  @ManyToMany({ primary: true, fieldName: 'taskId', entity: () => Task })
  public task!: Task;

}

describe('mikroOrm', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [User, Creator, CreatorsOnTasks, Task],
      dbName: ':memory:',
      type: 'sqlite',
      namingStrategy: EntityCaseNamingStrategy,
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

  test('shouldnt findOne and populate m:n relation', async () => {
    const { task } = await createEntities();

    const taskRepository = orm.em.fork().getRepository(Task);
    await expect(
      taskRepository.findOne({ id: task.id }, { populate: ['creators'] }),
    ).resolves.not.toThrow();
  });

});
