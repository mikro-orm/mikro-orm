import { Collection, Entity, ManyToMany, MikroORM, PrimaryKey, Property, ObjectId } from '@mikro-orm/mongodb';

@Entity()
class Manager {

  @PrimaryKey()
  _id!: ObjectId;

  @ManyToMany({ entity: () => Task, lazy: true })
  tasks = new Collection<Task>(this);

}

@Entity()
class Task {

  @PrimaryKey()
  _id!: ObjectId;

  @Property()
  name!: string;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Manager, Task],
    dbName: ':memory:',
  });
  await orm.schema.createSchema();

  const task = new Task();
  task.name = 'task';

  const manager = new Manager();
  manager.tasks.set([task]);

  await orm.em.persistAndFlush(manager);
  orm.em.clear();
});

afterAll(() => orm.close(true));

test('owning side can intialize collections using loadItems', async () => {
  const [manager] = await orm.em.findAll(Manager);
  expect(manager.tasks.isInitialized()).toBe(false);

  await manager.tasks.loadItems();
  expect(manager.tasks).toHaveLength(1);
  expect(manager.tasks.isInitialized(true)).toBe(true);
});
