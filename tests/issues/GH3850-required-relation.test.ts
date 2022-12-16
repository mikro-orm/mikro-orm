import { Entity, OneToOne, PrimaryKey, Property, RequiredEntityData } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/sqlite';

@Entity()
class User {

  @PrimaryKey()
  id!: number;

  @Property({ nullable: true })
  name!: string;

  @OneToOne(() => Project, project => project.owner, {
    owner: true,
    nullable: false,
  })
  project!: Project | null;

}

@Entity()
class Project {

  @PrimaryKey()
  id!: number;

  @Property({ nullable: true })
  name!: string;

  @OneToOne(() => User, user => user.project, { nullable: false })
  owner?: User;

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

async function createUser(props: RequiredEntityData<User>) {
  const u = orm.em.create(User, {
    ...props,
  });

  await orm.em.flush();
  orm.em.clear();

  return orm.em.findOneOrFail(User, u.id, { populate: ['project'] });
}

async function createProject(props: RequiredEntityData<Project>) {
  const project = orm.em.create(Project, {
    ...props,
  });

  await orm.em.flush();
  orm.em.clear();

  return orm.em.findOneOrFail(Project, project.id, { populate: ['owner'] });
}

describe('Required 1-to-1 relation propagation', () => {
  test('Can create a required 1-to-1 relationship', async () => {
    let project = orm.em.create(Project, {
      name: 'Project 1',
    });
    let owner = await createUser({ name: 'User 1', project });

    // Refetch and check relation (owner)
    owner = await orm.em.findOneOrFail(User, owner.id, { populate: ['project'] });
    expect(owner.project?.name).toBe('Project 1');
    // Refetch and check un-linked entity (inverse side)
    project = await orm.em.findOneOrFail(Project, project.id, { populate: ['owner'] });
    expect(project.owner?.name).toBe('User 1');
  });

  // Swapping related entities (replacing one relation with a new entity)
  test('can swap existing inverse entity on owner side', async () => {
    let project1 = orm.em.create(Project, {
      name: 'Project 1',
    });
    let owner = await createUser({ name: 'User 1', project: project1 });

    project1 = owner.project as Project;
    // Create new project and assign to user
    let project2 = orm.em.create(Project, {
      name: 'Project 2',
    });
    owner.project = project2;
    orm.em.persist(project2);
    // Remove previous
    orm.em.remove(project1);
    // Check value before flush
    expect(owner.project.name).toBe('Project 2');
    expect(project2.owner).toBeTruthy();

    // Flush changes
    await orm.em.flush();
    orm.em.clear();

    // Refetch and check relation (owner)
    owner = await orm.em.findOneOrFail(User, owner.id, { populate: ['project'] });
    expect(owner.project?.name).toBe('Project 2');
    // Refetch and check new entity (inverse side)
    project2 = await orm.em.findOneOrFail(Project, project2.id, { populate: ['owner'] });
    expect(project2.owner).toBeTruthy();
    // Refetch and check removed entity (inverse side)
    const oldProject = await orm.em.findOne(Project, project1.id);
    expect(oldProject).toBeFalsy();
  });

  test('can swap existing owner entity on inverse side', async () => {
    let owner1 = orm.em.create(User, {
      name: 'User 1',
    });
    let project = await createProject({ name: 'Project 1', owner: owner1 });

    owner1 = project.owner as User;
    // Create new owner and assign to project
    let owner2 = orm.em.create(User, {
      name: 'User 2',
    });
    project.owner = owner2;
    orm.em.persist(owner2);
    // Check value before flush
    // Remove previous
    orm.em.remove(owner1);
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
    // Refetch and check removed entity (inverse side)
    const oldOwner = await orm.em.findOne(User, owner1.id);
    expect(oldOwner).toBeFalsy();
  });
});


