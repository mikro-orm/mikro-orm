import 'reflect-metadata';
import { Collection, Entity, ManyToMany, ManyToOne, MikroORM, PrimaryKey, Property, wrap } from '@mikro-orm/core';
import { SchemaGenerator } from '@mikro-orm/knex';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';

@Entity({ tableName: 'auth.users' })
class TaskAssignee {

  @Property()
  avatar: string;

  @Property({ name: 'first_name' })
  firstName: string;

  @Property({ name: 'last_name' })
  lastName: string;

  @PrimaryKey({ name: 'id' })
  userid!: number;

  constructor(avatar: string, firstName: string, lastName: string) {
    this.avatar = avatar;
    this.firstName = firstName;
    this.lastName = lastName;
  }

}

@Entity({ tableName: 'operations.tasks' })
class Task {

  @ManyToMany({ entity: () => TaskAssignee, pivotTable: 'operations.task_assignees' })
  assignees = new Collection<TaskAssignee>(this);

  @ManyToOne(() => TaskAssignee, { nullable: true })
  assignee?: TaskAssignee;

  @PrimaryKey()
  id!: number;

}

describe('GH issue 450', () => {

  let orm: MikroORM<PostgreSqlDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Task, TaskAssignee],
      dbName: `mikro_orm_test_gh_450`,
      type: 'postgresql',
      cache: { enabled: false },
    });
    await new SchemaGenerator(orm.em).ensureDatabase();

    await orm.em.getConnection().execute('create schema if not exists auth');
    await orm.em.getConnection().execute('create schema if not exists operations');
    await orm.em.getConnection().execute('set search_path to auth, operations, public');

    await new SchemaGenerator(orm.em).dropSchema();
    await new SchemaGenerator(orm.em).createSchema();
  });

  afterAll(async () => {
    await new SchemaGenerator(orm.em).dropSchema(true, true, true);
    await new SchemaGenerator(orm.em).dropDatabase('auth');
    await new SchemaGenerator(orm.em).dropDatabase('operations');
    await orm.close(true);
  });

  test(`multiple schemas and m:n collections`, async () => {
    const t = new Task();
    t.assignees.add(new TaskAssignee('avatar', 'first', 'last'));
    await orm.em.persistAndFlush(t);
    orm.em.clear();

    const t1 = await orm.em.findOneOrFail(Task, t.id, ['assignees']);
    expect(t1.assignees.count()).toBe(1);
    expect(t1.assignees[0]).toBeInstanceOf(TaskAssignee);
    expect(wrap(t1.assignees[0]).isInitialized()).toBe(true);

    t1.assignee = t1.assignees[0];
    await orm.em.flush();
    orm.em.clear();

    const t2 = await orm.em.findOneOrFail(Task, t.id, ['assignee']);
    expect(t2.assignee).toBeInstanceOf(TaskAssignee);
    expect(wrap(t2.assignee).isInitialized()).toBe(true);
  });

});
