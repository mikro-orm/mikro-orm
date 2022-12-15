import { Entity, OneToOne, PrimaryKey, Property, wrap } from '@mikro-orm/core';
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
  public project!: Project | null;

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
  public owner!: User | null;

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

async function createUser() {
  const u = orm.em.create(User, {
    name: 'project name',
  });

  await orm.em.flush();
  orm.em.clear();

  return orm.em.findOneOrFail(User, u);
}

afterAll(async () => {
  await orm.close(true);
});

describe('GH3850 - Broken propagation with nullable 1-to-1 relation', () => {
  test('assign existing entity to another via 1-to-1 relationship (owner side)', async () => {
    let owner = await createUser();

    const newProject = new Project();
    owner.project = newProject;
    orm.em.persist(newProject);
    // Check value before flush
    expect(owner.project).toBeTruthy();
    expect(newProject.owner).toBeTruthy();

    // Flush changes
    await orm.em.flush();
    orm.em.clear();

    // Refetch and check relation
    owner = await orm.em.findOneOrFail(User, owner.id, { populate: ['project'] as any });
    expect(owner.project).toBeTruthy();

    // Refetch and check relation (inverse side)
    const project = await orm.em.findOneOrFail(Project, newProject.id, { populate: ['owner'] });
    expect(project.owner).toBeTruthy();
  });

  test('Should be able to assign existing entity to another via 1-to-1 relationship (inverse side)', async () => {
    let owner = await createUser();

    const newProject = new Project();
    newProject.owner = owner;
    orm.em.persist(newProject);
    // Check value before flush
    expect(owner.project).toBeTruthy();
    expect(newProject.owner).toBeTruthy();

    // Flush changes
    await orm.em.flush();
    orm.em.clear();

    // Refetch and check relation
    owner = await orm.em.findOneOrFail(User, owner.id, { populate: ['project'] as any });
    expect(owner.project).toBeTruthy();

    // Refetch and check relation (inverse side)
    const project = await orm.em.findOneOrFail(Project, newProject.id, { populate: ['owner'] });
    expect(project.owner).toBeTruthy();
  });
});


