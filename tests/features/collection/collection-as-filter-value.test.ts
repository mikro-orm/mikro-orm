import { Collection, MikroORM } from '@mikro-orm/sqlite';
import {
  Entity,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryKey,
  Property,
  ReflectMetadataProvider,
} from '@mikro-orm/decorators/legacy';
import { mockLogger } from '../../helpers.js';

@Entity()
class Workspace {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @ManyToMany(() => User, user => user.workspaces)
  users = new Collection<User>(this);
}

@Entity()
class User {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @ManyToMany(() => Workspace, workspace => workspace.users, { owner: true })
  workspaces = new Collection<Workspace>(this);

  @OneToMany(() => Task, task => task.owner)
  tasks = new Collection<Task>(this);
}

@Entity()
class Task {
  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

  @ManyToOne(() => User)
  owner!: User;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: ':memory:',
    entities: [User, Workspace, Task],
  });
  await orm.schema.create();

  const [w1, w2, w3] = [1, 2, 3].map(id => orm.em.create(Workspace, { id, name: `w${id}` }));
  const alice = orm.em.create(User, { id: 1, name: 'alice' });
  const bob = orm.em.create(User, { id: 2, name: 'bob' });
  alice.workspaces.add(w1, w2);
  bob.workspaces.add(w3);
  orm.em.create(Task, { id: 1, title: 't1', owner: alice });
  orm.em.create(Task, { id: 2, title: 't2', owner: alice });
  orm.em.create(Task, { id: 3, title: 't3', owner: bob });
  await orm.em.flush();
});

beforeEach(() => orm.em.clear());

afterAll(async () => {
  await orm.close(true);
});

test('uninitialized M:N collection as a filter value', async () => {
  const alice = await orm.em.findOneOrFail(User, 1);
  expect(alice.workspaces.isInitialized()).toBe(false);

  const mock = mockLogger(orm);
  const workspaces = await orm.em.find(Workspace, { id: alice.workspaces }, { orderBy: { id: 'asc' } });

  expect(workspaces.map(w => w.name)).toEqual(['w1', 'w2']);
  expect(mock).toHaveBeenCalledTimes(1);
  expect(mock.mock.calls[0][0]).toMatch(
    'select `w0`.* from `workspace` as `w0` where `w0`.`id` in (select `w0`.`workspace_id` from `user_workspaces` as `w0` where `w0`.`user_id` = 1)',
  );
  expect(alice.workspaces.isInitialized()).toBe(false);
});

test('uninitialized 1:M collection as a filter value', async () => {
  const alice = await orm.em.findOneOrFail(User, 1);

  const mock = mockLogger(orm);
  const tasks = await orm.em.find(Task, { id: alice.tasks }, { orderBy: { id: 'asc' } });

  expect(tasks.map(t => t.title)).toEqual(['t1', 't2']);
  expect(mock).toHaveBeenCalledTimes(1);
  expect(mock.mock.calls[0][0]).toMatch(
    'select `t0`.* from `task` as `t0` where `t0`.`id` in (select `t0`.`id` from `task` as `t0` where `t0`.`owner_id` = 1)',
  );
});

test('collection combined with other conditions in $or', async () => {
  const bob = await orm.em.findOneOrFail(User, 2);

  const workspaces = await orm.em.find(
    Workspace,
    { $or: [{ id: { $in: [1] } }, { id: bob.workspaces }] },
    { orderBy: { id: 'asc' } },
  );

  expect(workspaces.map(w => w.name)).toEqual(['w1', 'w3']);
});

test('collection as a filter value in query builder and count', async () => {
  const alice = await orm.em.findOneOrFail(User, 1);

  const workspaces = await orm.em
    .createQueryBuilder(Workspace)
    .where({ id: alice.workspaces })
    .orderBy({ id: 'asc' })
    .getResultList();
  const count = await orm.em.count(Workspace, { id: alice.workspaces });

  expect(workspaces.map(w => w.name)).toEqual(['w1', 'w2']);
  expect(count).toBe(2);
});

test('collection of an owner without a primary key', async () => {
  const user = orm.em.create(User, { name: 'new' });

  await expect(orm.em.find(Workspace, { id: user.workspaces })).rejects.toThrow(
    'Collection User.workspaces can be used as a filter value only when its owner has a primary key.',
  );
});
