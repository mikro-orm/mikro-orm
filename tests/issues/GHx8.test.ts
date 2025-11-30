import { Collection, MikroORM, PrimaryKeyProp, Ref } from '@mikro-orm/postgresql';
import { Entity, ManyToOne, OneToMany, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { v4 } from 'uuid';

@Entity()
class Organization {

  @PrimaryKey({ columnType: 'uuid' })
  id!: string;

}

@Entity()
class Project {

  [PrimaryKeyProp]?: ['id', 'organization'];

  @PrimaryKey({ columnType: 'uuid' })
  id!: string;

  @ManyToOne({ entity: () => Organization, ref: true, primary: true })
  organization!: Ref<Organization>;

  @Property({ length: 255 })
  name!: string;

  @ManyToOne({
    ref: true,
    entity: () => ProjectUpdate,
    joinColumns: ['project_id_1', 'organization_id'],
  })
  projectUpdate1!: Ref<ProjectUpdate>;

  @ManyToOne({
    ref: true,
    entity: () => ProjectUpdate,
    joinColumns: ['project_id_2', 'organization_id'],
  })
  projectUpdate2!: Ref<ProjectUpdate>;

}

@Entity()
class ProjectUpdate {

  [PrimaryKeyProp]?: ['id', 'organization'];

  @PrimaryKey({ columnType: 'uuid' })
  id!: string;

  @ManyToOne({ entity: () => Organization, ref: true, primary: true })
  organization!: Ref<Organization>;

  @Property({ nullable: true })
  test?: string;

  // Mapping this side doesn't seem to help
  @OneToMany({
    entity: () => Project,
    mappedBy: 'projectUpdate1',
    joinColumns: ['id', 'organization_id'],
  })
  projects1 = new Collection<Project>(this);

  @OneToMany({
    entity: () => Project,
    mappedBy: 'projectUpdate2',
    joinColumns: ['id', 'organization_id'],
  })
  projects2 = new Collection<Project>(this);

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: 'ghx8',
    entities: [ProjectUpdate],
  });
  await orm.schema.refresh();
});

afterAll(async () => {
  await orm.close(true);
});

test('bulk update props with compound keys', async () => {
  const globalEm = orm.em.fork();
  const projectId = v4();
  const projectId2 = v4();
  const updateId2 = v4();
  const updateId = v4();
  const orgId = v4();

  const initEm = globalEm.fork();
  const org = new Organization();
  initEm.assign(org, { id: orgId }, { em: initEm });

  await initEm.persistAndFlush(org);

  const projectUpdate1 = new ProjectUpdate();
  initEm.assign(projectUpdate1,
    {
      id: updateId,
      organization: orgId,
    },
    { em: initEm },
  );

  const projectUpdate2 = new ProjectUpdate();
  initEm.assign(projectUpdate2,
    {
      id: updateId2,
      organization: orgId,
    },
    { em: initEm },
  );

  const project = new Project();
  initEm.assign(project,
    {
      id: projectId,
      organization: orgId,
      name: 'init',
      projectUpdate1,
      projectUpdate2,
    },
    { em: initEm },
  );
  const project2 = new Project();
  initEm.assign(project2,
    {
      id: projectId2,
      organization: orgId,
      name: 'init2',
      projectUpdate1,
      projectUpdate2,
    },
    { em: initEm },
  );

  initEm.persist(project);
  initEm.persist(project2);

  await initEm.flush();

  // // new request

  const em = orm.em.fork();

  const p1 = em.getReference(Project, [projectId, orgId]);
  const p2 = em.getReference(Project, [projectId2, orgId]);

  // Switch project update ids to trigger updates
  em.assign(p1, {
    name: 'update',
    projectUpdate1: [updateId2, orgId],
    projectUpdate2: [updateId, orgId],
  });

  em.assign(p2, {
    name: 'update',
    projectUpdate1: [updateId2, orgId],
    projectUpdate2: [updateId, orgId],
  });

  em.persist(p1);
  em.persist(p2);

  await em.flush();
});
