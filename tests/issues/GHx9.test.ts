import { Entity, ManyToOne, OneToOne, Opt, PrimaryKey, Property, Ref, wrap } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/sqlite';
import { v4 } from 'uuid';

@Entity()
class Organization {

  @PrimaryKey({ columnType: 'uuid' })
  id = v4();

}

@Entity()
class Project {

  @PrimaryKey({ columnType: 'uuid' })
  id = v4();

  @ManyToOne({ entity: () => Organization, ref: true, primary: true })
  organization!: Ref<Organization>;

  @Property({ length: 255 })
  name!: string;

  @OneToOne({
    entity: () => ProjectUpdate,
    mappedBy: 'project',
    ref: true,
  })
  projectUpdate!: Ref<ProjectUpdate> & Opt;

}

@Entity()
class ProjectUpdate {

  @PrimaryKey({ columnType: 'uuid' })
  id = v4();

  @ManyToOne({ entity: () => Organization, ref: true, primary: true })
  organization!: Ref<Organization>;

  @OneToOne({
    entity: () => Project,
    ref: true,
    joinColumns: ['project_id', 'organization_id'],
  })
  project!: Ref<Project>;

}

let orm: MikroORM;
let org: Organization;
let project: Project;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [Project, Organization, ProjectUpdate],
  });

  await orm.schema.refreshDatabase();

  org = new Organization();
  project = orm.em.create(Project, {
    organization: org,
    name: 'init',
  });

  orm.em.create(ProjectUpdate, {
    organization: org.id,
    project,
  });

  await orm.em.flush();
});

afterAll(async () => {
  await orm.close();
});

beforeEach(() => orm.em.clear());

test('extra updates with 1:1 relations (select-in)', async () => {
  const result = await orm.em.findOneOrFail(Project, { id: project.id, organization: org.id }, {
    populate: ['projectUpdate'],
    strategy: 'select-in',
  });

  expect(wrap(result.projectUpdate.$).isTouched()).toBe(false);
  expect(wrap(result).isTouched()).toBe(false);

  expect(orm.em.getUnitOfWork().getChangeSets()).toHaveLength(0);
});

test('extra updates with 1:1 relations (joined)', async () => {
  const result = await orm.em.findOneOrFail(Project, { id: project.id, organization: org.id }, {
    populate: ['projectUpdate'],
    strategy: 'joined',
  });

  expect(wrap(result.projectUpdate.$).isTouched()).toBe(false);
  expect(wrap(result).isTouched()).toBe(false);

  orm.em.getUnitOfWork().computeChangeSets();
  expect(orm.em.getUnitOfWork().getChangeSets()).toHaveLength(0);
});
