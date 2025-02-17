import {
  Collection,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryKey,
  PrimaryKeyProp,
  Property,
  Ref,
  Unique,
} from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/sqlite';
import { v4 } from 'uuid';
import { mockLogger } from '../helpers.js';

@Entity()
class Organization {

  @PrimaryKey({ columnType: 'uuid' })
  id = v4();

}

@Entity()
class File {

  @PrimaryKey({ columnType: 'uuid' })
  id = v4();

  @ManyToOne({ entity: () => Organization, ref: true, primary: true })
  organization!: Ref<Organization>;

  @ManyToOne({
    entity: () => Document,
    ref: true,
    joinColumns: ['document_id', 'organization_id'],
  })
  document!: Ref<Document>;

}

@Entity()
class Document {

  [PrimaryKeyProp]?: ['id', 'organization'];

  @Unique({ name: 'document_id_unique' })
  @PrimaryKey({ columnType: 'uuid' })
  id = v4();

  @ManyToOne({ entity: () => Organization, ref: true, primary: true })
  organization!: Ref<Organization>;

  @ManyToOne({
    entity: () => Project,
    ref: true,
    joinColumns: ['project_id', 'organization_id'],
    nullable: true,
  })
  project?: Ref<Project>;

  @ManyToOne({
    entity: () => ProjectUpdate,
    ref: true,
    joinColumns: ['project_update_id', 'organization_id'],
    nullable: true,
  })
  projectUpdate?: Ref<ProjectUpdate>;

  @OneToMany({
    entity: () => File,
    mappedBy: 'document',
    orphanRemoval: true,
  })
  files = new Collection<File>(this);

}

@Entity()
class Project {

  [PrimaryKeyProp]?: ['id', 'organization'];

  @PrimaryKey({ columnType: 'uuid' })
  id = v4();

  @ManyToOne({ entity: () => Organization, ref: true, primary: true })
  organization!: Ref<Organization>;

  @Property({ length: 255 })
  name!: string;

  @OneToMany({
    entity: () => Document,
    mappedBy: 'project',
    orphanRemoval: true,
  })
  documents = new Collection<Document>(this);

  @OneToMany({
    entity: () => ProjectUpdate,
    mappedBy: 'project',
    orphanRemoval: true,
  })
  projectUpdates = new Collection<ProjectUpdate>(this);

}

@Entity()
class ProjectUpdate {

  [PrimaryKeyProp]?: ['id', 'organization'];

  @PrimaryKey({ columnType: 'uuid' })
  id = v4();

  @ManyToOne({ entity: () => Organization, ref: true, primary: true })
  organization!: Ref<Organization>;

  @ManyToOne({
    entity: () => Project,
    ref: true,
    joinColumns: ['project_id', 'organization_id'],
  })
  project!: Ref<Project>;

  @OneToMany({
    entity: () => Document,
    mappedBy: 'projectUpdate',
    orphanRemoval: true,
  })
  documents = new Collection<Document>(this);

}

let orm: MikroORM;
let org: Organization;
let project: Project;
let oldDocument: Document;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [Project, Organization, ProjectUpdate],
    loadStrategy: 'select-in',
  });
  await orm.schema.createSchema();
});

afterAll(async () => {
  await orm.close();
});

beforeEach(async () => {
  await orm.schema.clearDatabase();

  org = new Organization();
  project = orm.em.create(Project, {
    organization: org,
    name: 'init',
    documents: [{
      organization: org,
    }],
  });
  oldDocument = project.documents[0];
  await orm.em.flush();
  orm.em.clear();
});

test('orphan removal with complex FKs sharing a column (with loaded entity)', async () => {
  // Loading the project does make orphanremoval work
  const pr = await orm.em.findOneOrFail(Project, { organization: org.id });

  const projectUpdate = new ProjectUpdate();
  orm.em.assign(projectUpdate, {
    organization: org.id,
    project: [project.id, org.id],
  });

  const file = new File();
  const document = new Document();
  orm.em.assign(file, {
    organization: org.id,
    document: [document.id, org.id],
  });

  // We attach the same document to both the project and project update
  orm.em.assign(document, {
    organization: org.id,
    project: [project.id, org.id],
    projectUpdate: [projectUpdate.id, org.id],
    files: [file],
  });

  orm.em.assign(pr, {
    name: 'jos',
    documents: [document],
    projectUpdates: [projectUpdate],
  });

  const mock = mockLogger(orm, ['query']);
  await orm.em.flush();

  expect(mock.mock.calls).toHaveLength(8);
  expect(mock.mock.calls[0][0]).toMatch('begin');
  expect(mock.mock.calls[1][0]).toMatch('insert into `project_update` (`id`, `organization_id`, `project_id`) values (?, ?, ?)');
  expect(mock.mock.calls[2][0]).toMatch('insert into `document` (`id`, `organization_id`, `project_id`, `project_update_id`) values (?, ?, ?, ?)');
  expect(mock.mock.calls[3][0]).toMatch('insert into `file` (`id`, `organization_id`, `document_id`) values (?, ?, ?)');
  expect(mock.mock.calls[4][0]).toMatch('update `project` set `name` = ? where `id` = ? and `organization_id` = ?');
  expect(mock.mock.calls[5][0]).toMatch('delete from `document` where (`project_id`, `organization_id`) = (?, ?) and (`id`, `organization_id`) not in ((?, ?))');
  expect(mock.mock.calls[6][0]).toMatch('delete from `project_update` where (`project_id`, `organization_id`) = (?, ?) and (`id`, `organization_id`) not in ((?, ?))');
  expect(mock.mock.calls[7][0]).toMatch('commit');

  const exists = await orm.em.count(Document, oldDocument);
  expect(exists).toBe(0);
  const exists2 = await orm.em.count(ProjectUpdate, {});
  expect(exists2).toBe(1);
});

test('orphan removal with complex FKs sharing a column (with reference)', async () => {
  const pr = orm.em.getReference(Project, [project.id, org.id]);
  const projectUpdate = new ProjectUpdate();
  orm.em.assign(projectUpdate, {
    organization: org.id,
    project: [project.id, org.id],
  });

  const file = new File();
  const document = new Document();
  orm.em.assign(file, {
    organization: org.id,
    document: [document.id, org.id],
  });

  // We attach the same document to both the project and project update
  orm.em.assign(document, {
    organization: org.id,
    project: [project.id, org.id],
    projectUpdate: [projectUpdate.id, org.id],
    files: [file],
  });

  orm.em.assign(pr, {
    name: 'jos',
    documents: [document],
    projectUpdates: [projectUpdate],
  });

  const mock = mockLogger(orm, ['query']);
  await orm.em.flush();

  expect(mock.mock.calls).toHaveLength(8);
  expect(mock.mock.calls[0][0]).toMatch('begin');
  expect(mock.mock.calls[1][0]).toMatch('insert into `project_update` (`id`, `organization_id`, `project_id`) values (?, ?, ?)');
  expect(mock.mock.calls[2][0]).toMatch('insert into `document` (`id`, `organization_id`, `project_id`, `project_update_id`) values (?, ?, ?, ?)');
  expect(mock.mock.calls[3][0]).toMatch('insert into `file` (`id`, `organization_id`, `document_id`) values (?, ?, ?)');
  expect(mock.mock.calls[4][0]).toMatch('update `project` set `name` = ? where `id` = ? and `organization_id` = ?');
  expect(mock.mock.calls[5][0]).toMatch('delete from `document` where (`project_id`, `organization_id`) = (?, ?) and (`id`, `organization_id`) not in ((?, ?))');
  expect(mock.mock.calls[6][0]).toMatch('delete from `project_update` where (`project_id`, `organization_id`) = (?, ?) and (`id`, `organization_id`) not in ((?, ?))');
  expect(mock.mock.calls[7][0]).toMatch('commit');

  const exists = await orm.em.count(Document, oldDocument);
  expect(exists).toBe(0);
  const exists2 = await orm.em.count(ProjectUpdate, {});
  expect(exists2).toBe(1);
});

test('orphan removal with complex FKs sharing a column (with populated relation via joined strategy)', async () => {
  // Loading the project does make orphanremoval work
  const pr = await orm.em.findOneOrFail(Project, { organization: org.id }, {
    populate: ['documents', 'projectUpdates', 'projectUpdates.documents'],
    strategy: 'joined',
  });

  const projectUpdate = new ProjectUpdate();
  orm.em.assign(projectUpdate, {
    organization: org.id,
    project: [project.id, org.id],
  });

  const file = new File();
  const document = new Document();
  orm.em.assign(file, {
    organization: org.id,
    document: [document.id, org.id],
  });

  // We attach the same document to both the project and project update
  orm.em.assign(document, {
    organization: org.id,
    project: [project.id, org.id],
    projectUpdate: [projectUpdate.id, org.id],
    files: [file],
  });

  orm.em.assign(pr, {
    name: 'jos',
    documents: [document],
    projectUpdates: [projectUpdate],
  });

  const mock = mockLogger(orm, ['query']);
  await orm.em.flush();

  expect(mock.mock.calls).toHaveLength(7);
  expect(mock.mock.calls[0][0]).toMatch('begin');
  expect(mock.mock.calls[1][0]).toMatch('insert into `project_update` (`id`, `organization_id`, `project_id`) values (?, ?, ?)');
  expect(mock.mock.calls[2][0]).toMatch('insert into `document` (`id`, `organization_id`, `project_id`, `project_update_id`) values (?, ?, ?, ?)');
  expect(mock.mock.calls[3][0]).toMatch('insert into `file` (`id`, `organization_id`, `document_id`) values (?, ?, ?)');
  expect(mock.mock.calls[4][0]).toMatch('update `project` set `name` = ? where `id` = ? and `organization_id` = ?');
  expect(mock.mock.calls[5][0]).toMatch('delete from `document` where (`id`, `organization_id`) in ((?, ?))');
  expect(mock.mock.calls[6][0]).toMatch('commit');

  const exists = await orm.em.count(Document, oldDocument);
  expect(exists).toBe(0);
  const exists2 = await orm.em.count(ProjectUpdate, {});
  expect(exists2).toBe(1);
});
