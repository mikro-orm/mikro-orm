import {
  Collection,
  Entity,
  EventSubscriber,
  FlushEventArgs,
  IdentifiedReference,
  ManyToOne,
  MikroORM,
  OneToMany,
  PrimaryKey,
  Property,
} from '@mikro-orm/core';

@Entity()
class Project {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @OneToMany(() => ProjectUser, pu => pu.project, {
    eager: true,
    orphanRemoval: true,
  })
  users = new Collection<ProjectUser>(this);

}

@Entity()
class ProjectUser {

  @ManyToOne(() => Project, {
    primary: true,
    wrappedReference: true,
    serializer: p => p.id,
  })
  project!: IdentifiedReference<Project>;

  @ManyToOne(() => User, {
    primary: true,
    wrappedReference: true,
    serializer: u => u.id,
  })
  user!: IdentifiedReference<User>;

  @Property()
  accessLevel!: number;

}

@Entity()
class User {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @OneToMany(() => ProjectUser, pu => pu.user, {
    eager: true,
    orphanRemoval: true,
  })
  projects = new Collection<ProjectUser>(this);

}

class ProjectUsersSubscriber implements EventSubscriber<ProjectUser> {

  public async afterFlush(args: FlushEventArgs): Promise<void> {
    const uow = args.uow;
    const changeSets = uow
      .getChangeSets()
      .filter(cs => cs.entity instanceof ProjectUser);
    for (const cs of changeSets) {
      const pk = cs.getPrimaryKey(true) as Record<string, unknown>;
      // eslint-disable-next-line no-console
      console.log(pk); // should be {project: number, user: number}

      expect(pk).toBeInstanceOf(Object);
      expect(Array.isArray(pk)).toBe(false);
      expect(Object.keys(pk)).toMatchObject(['project', 'user']);
      expect(Object.values(pk).map(v => typeof v)).toMatchObject([
        'number',
        'number',
      ]);
    }
  }

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Project, User],
    type: 'better-sqlite',
    dbName: ':memory:',
    subscribers: [new ProjectUsersSubscriber()],
  });
});

beforeEach(async () => {
  await orm.schema.refreshDatabase();
});

async function createProject(): Promise<Project> {
  const user = orm.em.create(User, { name: 'Peter' });
  const project = orm.em.create(Project, { name: 'project name' });

  project.users.add(
    orm.em.create(ProjectUser, { user, project, accessLevel: 2 }),
  );

  await orm.em.flush();
  orm.em.clear();

  return orm.em.findOneOrFail(Project, { id: project.id });
}

afterAll(async () => {
  await orm.close(true);
});

test('primary key of changed entity in changeset should be object when adding an entity to a collection', async () => {
  const project = await createProject();
  const user = orm.em.create(User, { name: 'Thea' });

  project.users.add(
    orm.em.create(ProjectUser, { user, project, accessLevel: 3 }),
  );
  await orm.em.flush();
  expect.assertions(6);
});

test('primary key of changed entity in changeset should be object when removing an entity from a collection', async () => {
  const project = await createProject();

  project.users.remove(project.users[0]);
  await orm.em.flush();
  expect.assertions(6);
});
