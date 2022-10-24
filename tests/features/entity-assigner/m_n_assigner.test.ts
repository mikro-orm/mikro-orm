import {
  Collection,
  Entity,
  IdentifiedReference,
  ManyToOne,
  MikroORM,
  OneToMany,
  PrimaryKey,
  PrimaryKeyType,
  Property,
} from '@mikro-orm/core';
import type { SqliteDriver } from '@mikro-orm/sqlite';

@Entity()
export class ProjectUser {

  @Property()
  accessLevel!: number;

  @ManyToOne(() => Project, {
    primary: true,
    serializer: p => p.id,
    wrappedReference: true,
    onDelete: 'cascade',
  })
  public project!: IdentifiedReference<Project>;

  @ManyToOne(() => User, {
    primary: true,
    serializer: u => u.id,
    wrappedReference: true,
    onDelete: 'cascade',
  })
  public user!: IdentifiedReference<User>;

  [PrimaryKeyType]?: [number, number];

}

@Entity()
export class Project {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @OneToMany(() => ProjectUser, projectUsers => projectUsers.project, {
    orphanRemoval: true,
    eager: true,
  })
  public projectUsers = new Collection<ProjectUser>(this);

}

@Entity()
export class User {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @OneToMany(() => ProjectUser, projectUsers => projectUsers.user, {
    orphanRemoval: true,
    hidden: true,
  })
  public projectUsers = new Collection<ProjectUser>(this);

}

describe('M_N Assignment', () => {

  let orm: MikroORM<SqliteDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Project, User, ProjectUser],
      dbName: ':memory:',
      type: 'sqlite',
    });
    await orm.schema.createSchema();

    const users = [orm.em.create(User, {
      name: 'Peter',
    }), orm.em.create(User, {
      name: 'John',
    })];
    await orm.em.flush();
    orm.em.create(Project, {
      name: 'project name',
      projectUsers: [
        {
          user: users[0].id,
          accessLevel: 3,
        },
      ],
    });

    await orm.em.flush();
    orm.em.clear();
  });

  afterAll(async () => {
    await orm.close(true);
  });


  test('should update m:n relations', async () => {
    const project = await orm.em.findOneOrFail(Project, 1);
    const user = await orm.em.findOneOrFail(User, 2);

    orm.em.assign(project, {
      id: project.id,
      name: project.name,
      projectUsers: [{
        user: user.id,
        accessLevel: 2,
        project: project.id,
      }],
    });

    orm.em.flush();

    expect(project.projectUsers.count()).toBe(1);
  });
});
