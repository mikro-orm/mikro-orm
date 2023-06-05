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
import { mockLogger } from '../bootstrap';

@Entity({
  discriminatorColumn: 'type',
  abstract: true,
})
export class User {

  @PrimaryKey({ type: Number })
  id!: number;

  @Property()
  name!: string;

  @Enum()
  type!: 'manager' | 'employee';

}

@Entity({ discriminatorValue: 'manager' })
class Manager extends User {

  @ManyToMany(() => Task1, task => task.managers)
  tasks = new Collection<Task1>(this);

}

@Entity({ discriminatorValue: 'employee' })
class Employee extends User {}

@Entity({
  discriminatorColumn: 'type',
  abstract: true,
})
export class Task {

  @PrimaryKey({ type: Number })
  id!: number;

  @Property()
  name!: string;

  @Enum()
  type!: 'taks1' | 'task2';

}

@Entity({ discriminatorValue: 'task1' })
class Task1 extends Task {

  @ManyToMany(() => Manager, practitioner => practitioner.tasks, {
    owner: true,
  })
  managers = new Collection<Manager>(this);

}

@Entity({ discriminatorValue: 'task2' })
class Task2 extends Task {}

describe('GH issue 4423', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [User, Manager, Task],
      dbName: ':memory:',
    });
    await orm.schema.createSchema();

    const task = new Task1();
    task.name = 'task';

    const manager = new Manager();
    manager.name = 'manager';
    manager.tasks.set([task]);

    await orm.em.persistAndFlush(manager);
    orm.em.clear();
  });

  afterAll(() => orm.close(true));

  test('owning side', async () => {
    const mock = mockLogger(orm);
    await orm.em.find(
      Task1,
      {},
      {
        populate: ['managers'],
      },
    );

    expect(mock.mock.calls[0][0]).toMatch("select `t0`.* from `task` as `t0` where `t0`.`type` = 'task1'");
    expect(mock.mock.calls[1][0]).toMatch(
      "select `m0`.*, `t1`.`manager_id` as `fk__manager_id`, `t1`.`task1_id` as `fk__task1_id` from `user` as `m0` left join `task_managers` as `t1` on `m0`.`id` = `t1`.`manager_id` and `m0`.`type` = 'manager' where `t1`.`task1_id` in (1) and `m0`.`type` = 'manager'",
    );
  });

  test('not owning side', async () => {
    const mock = mockLogger(orm);
    await orm.em.find(
      Manager,
      {},
      {
        populate: ['tasks'],
      },
    );
    expect(mock.mock.calls[0][0]).toMatch("select `m0`.* from `user` as `m0` where `m0`.`type` = 'manager'");
    expect(mock.mock.calls[1][0]).toMatch(
      "select `t0`.*, `t1`.`task1_id` as `fk__task1_id`, `t1`.`manager_id` as `fk__manager_id` from `task` as `t0` left join `task_managers` as `t1` on `t0`.`id` = `t1`.`task1_id` and `t0`.`type` = 'task1' where `t1`.`manager_id` in (1) and `t0`.`type` = 'task1'",
    );
  });
});
