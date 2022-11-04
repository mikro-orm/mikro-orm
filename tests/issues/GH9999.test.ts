import { ChangeSetType, Collection, Entity, EventSubscriber, FlushEventArgs, IdentifiedReference, ManyToOne, MikroORM, OneToMany, PrimaryKey, Property } from '@mikro-orm/core';

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

  public async onFlush(args: FlushEventArgs): Promise<void> {
    const uow = args.uow;
    const changeSets = uow
      .getChangeSets()
      .filter(cs => cs.entity instanceof ProjectUser);
    for (const cs of changeSets) {
      if (
        cs.type === ChangeSetType.DELETE
      ) {
        const projectUser = cs.entity as ProjectUser; // We know entity is instanceof ProjectUser because of filter above
        // Project or user is null, but should be set. This has been so until v5.4.2 and is now since v5.5.0 null
        expect(projectUser.user).not.toBeNull();
        expect(projectUser.project).not.toBeNull();
      }

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

  project.users.add(orm.em.create(ProjectUser, { user, project, accessLevel: 2 }));

  await orm.em.flush();
  orm.em.clear();

  return orm.em.findOneOrFail(Project, { id: project.id });
}

afterAll(async () => {
  await orm.close(true);
});

test('unset a many to many relation and check the old relation in a subscriber', async () => {
  const project = await createProject();

  project.users.remove(project.users.getItems()[0]);
  await orm.em.flush();
});

test('unset a many to many relation from the other side and check the old relation in a subscriber', async () => {
  const project = await createProject();
  const user = await project.users.getItems()[0].user.load();

  user.projects.remove(project.users.getItems()[0]);
  await orm.em.flush();
});

