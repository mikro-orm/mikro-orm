import { Collection, MikroORM, wrap, LoadStrategy } from '@mikro-orm/sqlite';

import { Entity, Enum, Filter, ManyToOne, OneToMany, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
@Filter({ name: 'notDeleted', cond: { deletedAt: null }, default: true })
class BaseEntity {

  @PrimaryKey({ type: 'string' })
  id!: string;

  @Property({ type: 'Date', nullable: true })
  deletedAt: Date | null = null;

}

enum ProjectMemberType {
  TYPE1 = 'TYPE1',
  TYPE2 = 'TYPE2',
}

@Entity()
class RoleEntity extends BaseEntity {

}

@Entity()
class User extends BaseEntity {

  @OneToMany(() => ProjectMember, projectMember => projectMember.user)
  projectMembers!: Collection<ProjectMember>;

  @ManyToOne(() => RoleEntity, { strategy: 'joined' })
  role!: RoleEntity;

}

@Entity()
class Project extends BaseEntity {

  @OneToMany(() => ProjectMember, member => member.project)
  members!: Collection<ProjectMember>;

}

@Entity()
class ProjectMember extends BaseEntity {

  @Enum({
    items: () => ProjectMemberType,
    default: ProjectMemberType.TYPE1,
  })
  type: ProjectMemberType = ProjectMemberType.TYPE1;

  @ManyToOne(() => User)
  user!: User;

  @ManyToOne(() => Project)
  project!: Project;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [User, ProjectMember, Project],
    dbName: ':memory:',
    loadStrategy: 'select-in',
  });
  await orm.schema.create();

  const user1 = orm.em.create(User, {
    id: '1',
    role: { id: '1' },
  });
  const user2 = orm.em.create(User, {
    id: '2',
    role: { id: '2' },
  });
  const project = orm.em.create(Project, { id: '1' });
  orm.em.create(ProjectMember, {
    id: '1',
    user: user1,
    project,
    type: ProjectMemberType.TYPE1,
  });
  orm.em.create(ProjectMember, {
    id: '2',
    user: user2,
    project,
    type: ProjectMemberType.TYPE1,
  });
  await orm.em.flush();

  user1.deletedAt = new Date();
  await orm.em.persistAndFlush(user1);

  orm.em.clear();
});

afterAll(async () => {
  await orm.close(true);
});

test.each(Object.values(LoadStrategy))('should populate project members with specific type using populateWhere using "%s" strategy', async strategy => {
  const row = await orm.em.findOneOrFail(Project, '1', {
    populate: ['members.user.role'],
    populateWhere: {
      members: {
        type: ProjectMemberType.TYPE1,
      },
    },
    strategy,
  });
  expect(wrap(row).toObject()).toMatchObject({
    id: '1',
    deletedAt: null,
    members: [
      {
        id: '2',
        deletedAt: null,
        type: 'TYPE1',
        user: { id: '2', deletedAt: null, role: { id: '2', deletedAt: null } },
        project: '1',
      },
    ],
  });
});
