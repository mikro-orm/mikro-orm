import {
  BaseEntity,
  Collection,
  Entity,
  ManyToOne,
  MikroORM,
  OneToMany,
  PrimaryKey,
  PrimaryKeyProp,
  Ref,
} from '@mikro-orm/sqlite';
import { v4 } from 'uuid';

@Entity()
class Organization extends BaseEntity {

  @PrimaryKey({ type: 'uuid' })
  id!: string;

}

@Entity()
class TaskReviewer extends BaseEntity {

  [PrimaryKeyProp]?: ['id', 'organization'];

  @PrimaryKey({ type: 'uuid' })
  id!: string;

  @ManyToOne({ entity: () => Organization, ref: true, primary: true })
  organization!: Ref<Organization>;

  @ManyToOne({
    entity: () => Task,
    ref: true,
    deleteRule: 'cascade',
    joinColumns: ['task_id', 'organization_id'],
  })
  task!: Ref<Task>;

  @ManyToOne({
    entity: () => TaskReviewer,
    deleteRule: 'set null',
    ref: true,
    nullable: true,
    joinColumns: ['previous_reviewer_id', 'organization_id'],
  })
  previousReviewer?: Ref<TaskReviewer> | null;

}

@Entity()
class Task extends BaseEntity {

  [PrimaryKeyProp]?: ['id', 'organization'];

  @PrimaryKey({ type: 'uuid' })
  id!: string;

  @ManyToOne({ entity: () => Organization, ref: true, primary: true })
  organization!: Ref<Organization>;

  @OneToMany({
    entity: () => TaskReviewer,
    mappedBy: 'task',
    orphanRemoval: true,
  })
  reviewers = new Collection<TaskReviewer>(this);

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [Organization, TaskReviewer, Task],
  });
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

test('unsetting shared composite property [single]', async () => {
  const orgId = v4();
  orm.em.create(Organization, { id: orgId });
  await orm.em.flush();
  orm.em.clear();

  const taskId = v4();
  const reviewerId1 = v4();
  const reviewerId2 = v4();

  const newTask = orm.em.create(Task, {
    id: taskId,
    organization: orgId,
  });
  orm.em.assign(newTask, {
    reviewers: [
      {
        id: reviewerId1,
        task: [taskId, orgId],
        organization: orgId,
      },
      {
        id: reviewerId2,
        previousReviewer: [reviewerId1, orgId],
        task: [taskId, orgId],
        organization: orgId,
      },
    ],
  });
  await orm.em.flush();
  orm.em.clear();

  const reviewer2 = await orm.em.findOneOrFail(TaskReviewer, {
    id: reviewerId2,
  });
  reviewer2.previousReviewer = null;

  await orm.em.flush();
});

test('unsetting shared composite property [batched]', async () => {
  const orgId = v4();
  orm.em.create(Organization, { id: orgId });
  await orm.em.flush();
  orm.em.clear();

  const taskId = v4();
  const reviewerId1 = v4();
  const reviewerId2 = v4();
  const reviewerId3 = v4();

  const newTask = orm.em.create(Task, {
    id: taskId,
    organization: orgId,
  });
  orm.em.assign(newTask, {
    reviewers: [
      {
        id: reviewerId1,
        task: [taskId, orgId],
        organization: orgId,
      },
      {
        id: reviewerId2,
        previousReviewer: [reviewerId1, orgId],
        task: [taskId, orgId],
        organization: orgId,
      },
      {
        id: reviewerId3,
        previousReviewer: [reviewerId2, orgId],
        task: [taskId, orgId],
        organization: orgId,
      },
    ],
  });
  await orm.em.flush();
  orm.em.clear();

  const reviewer2 = await orm.em.findOneOrFail(TaskReviewer, {
    id: reviewerId2,
  });
  const reviewer3 = await orm.em.findOneOrFail(TaskReviewer, {
    id: reviewerId3,
  });
  reviewer2.previousReviewer = null;
  reviewer3.previousReviewer = null;

  await orm.em.flush();
});
