import { Collection, EntitySchema, MikroORM } from '@mikro-orm/core';
import type { AbstractSqlDriver } from '@mikro-orm/knex';
import { v4 } from 'uuid';

class TaskProps {

  id = v4();
  version = new Date();
  projects = new Collection<ProjectProps>(this);

}

class ProjectProps {

  id = v4();
  name!: string;
  tasks = new Collection<TaskProps>(this);

}

const TaskSchema = new EntitySchema<TaskProps>({
  class: TaskProps,
  tableName: 'task',
  properties: {
    id: {
      type: 'string',
      primary: true,
      length: 36,
    },
    version: {
      type: 'Date',
      primary: true,
      length: 6,
    },
    projects: {
      entity: () => ProjectProps,
      reference: 'm:n',
      inversedBy: 'tasks',
    },
  },
});

const ProjectSchema = new EntitySchema<ProjectProps>({
  class: ProjectProps,
  tableName: 'project',
  properties: {
    id: {
      type: 'string',
      primary: true,
      length: 36,
    },
    name: {
      type: 'string',
    },
    tasks: {
      entity: () => TaskProps,
      mappedBy: 'projects',
      reference: 'm:n',
    },
  },
});

describe('GH issue 603', () => {

  let orm: MikroORM<AbstractSqlDriver>;
  let projectId: string;
  let taskId: string;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [TaskSchema, ProjectSchema],
      dbName: `mikro_orm_test_gh_603`,
      type: 'mysql',
      port: 3307,
    });
    await orm.getSchemaGenerator().ensureDatabase();
    await orm.getSchemaGenerator().dropSchema();
    await orm.getSchemaGenerator().createSchema();

    const project = orm.em.create(ProjectProps, { name: 'Test project' });
    const task = orm.em.create(TaskProps, {});
    await orm.em.persistAndFlush([project, task]);
    projectId = project.id;
    taskId = task.id;
    orm.em.clear();
  });

  afterAll(async () => {
    await orm.close(true);
  });

  test(`GH issue 603, create entity`, async () => {
    const project = await orm.em.findOneOrFail(ProjectProps, projectId);
    const task = orm.em.create(TaskProps, {});
    orm.em.persist(task);
    task.projects.add(project);
    await expect(orm.em.flush()).resolves.not.toThrow();
    orm.em.clear();
  });

  // here is example, where history table implemented inside actual table with data, using
  // composite pk for versioning purposes. Id stays the same, but version can be changed
  test(`GH issue 603, update entity`, async () => {
    const project = await orm.em.findOneOrFail(ProjectProps, projectId);
    const task = await orm.em.findOneOrFail(TaskProps, { id: taskId });
    const newVersion = orm.em.create(TaskProps, { id: task.id });
    newVersion.projects.add(project);
    await expect(orm.em.flush()).resolves.not.toThrow();
    orm.em.clear();
  });

});
