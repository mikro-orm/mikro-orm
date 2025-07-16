import {
  Collection,
  Entity,
  ManyToOne,
  MikroORM,
  OneToMany,
  PrimaryKey,
  PrimaryKeyProp,
  Property,
  Unique,
  type Ref,
} from '@mikro-orm/sqlite';
import { v4 } from 'uuid';

@Entity({ tableName: 'organization' })
class OrganizationMikroModel {

  @PrimaryKey({ columnType: 'uuid' })
  id!: string;

  @Unique({ name: 'organization_name_unique' })
  @Property({ columnType: 'text', length: 255 })
  name!: string;

}

@Entity({ tableName: 'task_assignee' })
class TaskAssigneeMikroModel {

  [PrimaryKeyProp]?: ['task', 'organization'];

  @ManyToOne({
    entity: () => TaskMikroModel,
    ref: true,
    deleteRule: 'cascade',
    joinColumns: ['task_id', 'organization_id'],
    primary: true,
  })
  task!: Ref<TaskMikroModel>;

  @ManyToOne({ entity: () => OrganizationMikroModel, ref: true, primary: true })
  organization!: Ref<OrganizationMikroModel>;

}

@Entity({ tableName: 'task' })
class TaskMikroModel {

  [PrimaryKeyProp]?: ['id', 'organization'];

  @PrimaryKey({ type: 'uuid' })
  id!: string;

  @ManyToOne({ entity: () => OrganizationMikroModel, ref: true, primary: true })
  organization!: Ref<OrganizationMikroModel>;

  @OneToMany({ entity: () => TaskAssigneeMikroModel, mappedBy: 'task', orphanRemoval: true })
  internalTaskTeam = new Collection<TaskAssigneeMikroModel>(this);

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [OrganizationMikroModel, TaskAssigneeMikroModel, TaskMikroModel],
    loadStrategy: 'select-in',
  });
  await orm.schema.createSchema();
});

afterAll(async () => {
  await orm.close(true);
});

test('basic CRUD example', async () => {
  const organization = orm.em.create(OrganizationMikroModel, { id: v4(), name: 'test' });
  const task = orm.em.create(TaskMikroModel, {
    id: v4(),
    organization: organization.id,
    internalTaskTeam: [],
  });
  orm.em.create(TaskAssigneeMikroModel, {
    task: [task.id, organization.id],
    organization: organization.id,
  });
  await orm.em.flush();
  orm.em.clear();

  const r = await orm.em.find(TaskMikroModel, {}, { populate: ['internalTaskTeam'] });
  expect(r).toHaveLength(1);
});
