import {
  Collection,
  Entity,
  Enum,
  ManyToMany,
  MikroORM,
  OneToOne,
  PrimaryKey,
  Property,
  Ref,
  wrap,
} from '@mikro-orm/sqlite';
import { mockLogger } from '../../bootstrap';

@Entity({
  discriminatorColumn: 'type',
  abstract: true,
})
class User {

  @PrimaryKey({ type: Number })
  id!: number;

  @Property()
  name!: string;

  @Enum()
  type!: 'manager' | 'employee';

}

@Entity({ discriminatorValue: 'manager' })
class Manager extends User {

  @ManyToMany(() => Task, task => task.managers)
  tasks = new Collection<Task>(this);

  @OneToOne(() => Task, { owner: true, ref: true })
  favoriteTask?: Ref<Task>;

}

@Entity({ discriminatorValue: 'employee' })
class Employee extends User {}

@Entity()
class Task {

  @PrimaryKey({ type: Number })
  id!: number;

  @Property()
  name!: string;

  @ManyToMany(() => Manager)
  managers = new Collection<Manager>(this);

}

describe('GH issue 4423', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [User, Manager, Task],
      dbName: ':memory:',
    });
    await orm.schema.createSchema();

    const task = new Task();
    task.name = 'task';

    const manager = new Manager();
    manager.name = 'manager';
    manager.tasks.set([task]);
    manager.favoriteTask = wrap(task).toReference();

    await orm.em.persistAndFlush(manager);
    orm.em.clear();
  });

  afterAll(() => orm.close(true));

  test('The owning side is in the main entity, This one chooses the wrong column of the pivot table', async () => {
    const mock = mockLogger(orm);
    await orm.em.find(
      Task,
      {},
      {
        populate: ['managers'],
      },
    );
    expect(mock.mock.calls[1][0]).toMatch(
      "select `m0`.*, `t1`.`manager_id` as `fk__manager_id`, `t1`.`task_id` as `fk__task_id` from `user` as `m0` left join `task_managers` as `t1` on `m0`.`id` = `t1`.`manager_id` where `t1`.`task_id` in (1) and `m0`.`type` = 'manager'",
    );
  });

  test('The owning side is in the relation, This one works normally', async () => {
    const mock = mockLogger(orm);
    await orm.em.find(
      Manager,
      {},
      {
        populate: ['tasks'],
      },
    );

    expect(mock.mock.calls[1][0]).toMatch(
      'select `t0`.*, `t1`.`manager_id` as `fk__manager_id`, `t1`.`task_id` as `fk__task_id` from `task` as `t0` left join `task_managers` as `t1` on `t0`.`id` = `t1`.`task_id` where `t1`.`manager_id` in (1)',
    );
  });
});
