import { Entity, OneToOne, PrimaryKey, Property } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/sqlite';

@Entity()
class User {

  @PrimaryKey()
  id!: number;

  @Property({ nullable: true })
  name!: string;

  @OneToOne(() => Project, project => project.owner, {
    nullable: true,
    owner: true,
  })
  project!: Project | null;

}

@Entity()
class Project {

  @PrimaryKey()
  id!: number;

  @Property({ nullable: true })
  name!: string;

  @OneToOne(() => User, user => user.project, {
    nullable: true,
  })
  owner!: User | null;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Project, User],
    dbName: ':memory:',
  });
});

beforeEach(async () => {
  await orm.schema.refreshDatabase();
});

afterAll(() => orm.close(true));

async function createUser(props?: Partial<User>) {
  const u = orm.em.create(User, {
    name: 'User name',
    ...props,
  });

  await orm.em.flush();
  orm.em.clear();

  return orm.em.findOneOrFail(User, u.id, { populate: ['project'] });
}

async function createProject(props?: Partial<Project>) {
  const project = orm.em.create(Project, {
    name: 'Project name',
    ...props,
  });

  await orm.em.flush();
  orm.em.clear();

  return orm.em.findOneOrFail(Project, project.id, { populate: ['owner'] });
}

describe('GH3850 - Broken propagation with nullable 1-to-1 relation', () => {

  // Adding a new entity and linking to an existing entity via the relation
  test('can link new inverse entity to owner entity (from null)', async () => {
    let owner = await createUser();

    let project = orm.em.create(Project, {
      name: 'project 1',
      owner,
    });
    owner.project = project;
    orm.em.persist(project);
    // Check value before flush
    expect(owner.project).toBeTruthy();
    expect(project.owner).toBeTruthy();

    // Flush changes
    await orm.em.flush();
    orm.em.clear();

    // Refetch and check relation
    owner = await orm.em.findOneOrFail(User, owner.id, { populate: ['project'] });
    expect(owner.project).toBeTruthy();
    // Refetch and check relation (inverse side)
    project = await orm.em.findOneOrFail(Project, project.id, { populate: ['owner'] });
    expect(project.owner).toBeTruthy();
  });

  test('can link new owner entity to inverse entity (from null)', async () => {
    let project = await createProject();

    let owner = orm.em.create(User, {
      name: 'User 1',
      project,
    });
    orm.em.persist(owner);
    // Check value before flush
    expect(owner.project).toBeTruthy();
    expect(project.owner).toBeTruthy();

    // Flush changes
    await orm.em.flush();
    orm.em.clear();

    // Refetch and check relation
    owner = await orm.em.findOneOrFail(User, owner.id, { populate: ['project'] as any });
    expect(owner.project).toBeTruthy();
    // Refetch and check relation (inverse side)
    project = await orm.em.findOneOrFail(Project, project.id, { populate: ['owner'] });
    expect(project.owner).toBeTruthy();
  });

  // Swapping related entities (replacing one relation with a new entity)
  test('can swap existing inverse entity on owner side', async () => {
    let project1 = orm.em.create(Project, {
      name: 'Project 1',
    });
    let owner = await createUser({ project: project1 });

    // Create new project and assign to user
    let project2 = orm.em.create(Project, {
      name: 'Project 2',
    });

    project1 = owner.project as Project;
    owner.project = project2;
    orm.em.persist(project2);
    // Check value before flush
    expect(owner.project.name).toBe('Project 2');
    expect(project2.owner).toBeTruthy();
    expect(project1.owner).toBeFalsy();

    // Flush changes
    await orm.em.flush();
    orm.em.clear();

    // Refetch and check relation (owner)
    owner = await orm.em.findOneOrFail(User, owner.id, { populate: ['project'] });
    expect(owner.project?.name).toBe('Project 2');
    // Refetch and check new entity (inverse side)
    project2 = await orm.em.findOneOrFail(Project, project2.id, { populate: ['owner'] });
    expect(project2.owner).toBeTruthy();
    // Refetch and check un-linked entity (inverse side)
    project1 = await orm.em.findOneOrFail(Project, project1.id, { populate: ['owner'] });
    expect(project1.owner).toBeFalsy();
  });

  test('can swap existing owner entity on inverse side', async () => {
    let owner1 = orm.em.create(User, {
      name: 'User 1',
    });
    let project = await createProject({ owner: owner1 });

    // Create new owner and assign to project
    let owner2 = orm.em.create(User, {
      name: 'User 2',
    });

    owner1 = project.owner as User;
    project.owner = owner2;
    orm.em.persist(owner2);
    // Check value before flush
    expect(project.owner.name).toBe('User 2');
    expect(owner2.project).toBeTruthy();
    expect(owner1.project).toBeFalsy();

    // Flush changes
    await orm.em.flush();
    orm.em.clear();

    // Refetch and check relation (inverse side)
    project = await orm.em.findOneOrFail(Project, project.id, { populate: ['owner'] });
    expect(project.owner?.name).toBe('User 2');
    // Refetch and check new entity (owner side)
    owner2 = await orm.em.findOneOrFail(User, owner2.id, { populate: ['project'] });
    expect(owner2.project).toBeTruthy();
    // Refetch and check un-linked entity (owner side)
    owner1 = await orm.em.findOneOrFail(User, owner1.id, { populate: ['project'] });
    expect(owner1.project).toBeFalsy();
  });

  // Un-linking entities (but both entities stay around)
  test('can un-link existing entity from 1-to-1 relationship (owner side)', async () => {
    let project = orm.em.create(Project, {
      name: 'Project 1',
    });
    let owner = await createUser({ project });

    project = owner.project as Project;
    owner.project = null;
    // Check value before flush
    expect(owner.project).toBeFalsy();
    expect(project.owner).toBeFalsy();

    // Flush changes
    await orm.em.flush();
    orm.em.clear();

    // Refetch and check relation (owner)
    owner = await orm.em.findOneOrFail(User, owner.id, { populate: ['project'] });
    expect(owner.project).toBeFalsy();
    // Refetch and check un-linked entity (inverse side)
    project = await orm.em.findOneOrFail(Project, project.id, { populate: ['owner'] });
    expect(project.owner).toBeFalsy();
  });

  test('can un-link existing entity to another via 1-to-1 relationship (inverse side)', async () => {
    let owner = orm.em.create(User, {
      name: 'User 1',
    });
    let project = await createProject({ owner });

    owner = project.owner as User;
    project.owner = null;
    // Check value before flush
    expect(project.owner).toBeFalsy();
    expect(owner.project).toBeFalsy();

    // Flush changes
    await orm.em.flush();
    orm.em.clear();

    // Refetch and check relation (inverse)
    project = await orm.em.findOneOrFail(Project, project.id, { populate: ['owner'] });
    expect(project.owner).toBeFalsy();
    // Refetch and check un-linked entity (owner side)
    owner = await orm.em.findOneOrFail(User, owner.id, { populate: ['project'] });
    expect(owner.project).toBeFalsy();
  });

  // Deleting entities
  test('can un-link entities when deleting the inverse entity', async () => {
    const project = orm.em.create(Project, {
      name: 'Project 1',
    });
    let owner = await createUser({ project });

    orm.em.remove(owner.project as Project);
    owner.project = null; // NOTE: we still have to unset the project here
    // Check value now null before flush
    expect(owner.project).toBeFalsy();

    // Flush changes
    await orm.em.flush();
    orm.em.clear();

    // Refetch and check relation (owner)
    owner = await orm.em.findOneOrFail(User, owner.id, { populate: ['project'] });
    expect(owner.project).toBeFalsy();
    // Check inverse has been deleted
    const deletedProject = await orm.em.findOne(Project, project.id);
    expect(deletedProject).toBeNull();
  });

  test('can un-link entities when deleting the inverse entity', async () => {
    const owner = orm.em.create(User, {
      name: 'User 1',
    });
    let project = await createProject({ owner });

    orm.em.remove(project.owner as User);
    project.owner = null; // NOTE: we still have to unset the project here
    // Check value now null before flush
    expect(project.owner).toBeFalsy();

    // Flush changes
    await orm.em.flush();
    orm.em.clear();

    // Refetch and check relation (inverse)
    project = await orm.em.findOneOrFail(Project, project.id, { populate: ['owner'] });
    expect(project.owner).toBeFalsy();
    // Check owner has been deleted
    const deletedOwner = await orm.em.findOne(User, owner.id);
    expect(deletedOwner).toBeNull();
  });
});


