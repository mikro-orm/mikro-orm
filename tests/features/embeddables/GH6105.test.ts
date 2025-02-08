import { MikroORM } from '@mikro-orm/sqlite';
import { BaseEntity, Config, DefineConfig, Embeddable, Embedded, Entity, EntityDTO, EntityRef, Enum, ManyToOne, Opt, PrimaryKey, Property } from '@mikro-orm/core';

@Embeddable()
class Name {

  @Property()
  first!: string;

  @Property()
  last!: string;

  @Property({ persist: false, getter: true })
  get display(): Opt<string> {
    return `${this.first} ${this.last}`;
  }

}

@Entity()
class Person extends BaseEntity {

  @PrimaryKey()
  id!: number;

  @Embedded(() => Name)
  name!: Name;

}


@Entity()
class Group {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

}

@Embeddable({ abstract: true, discriminatorColumn: 'type' })
abstract class Role<T extends string> {

  @Enum({ items: ['admin', 'visitor'] })
  type!: T;

}
@Embeddable({ discriminatorValue: 'visitor' })
class RoleVisitor extends Role<'visitor'> {

  @Property()
  comment!: string;

  @Property({ getter: true, persist: false })
  get short(): Opt<string> {
    return this.comment.split(' ')[0];
  }

}
@Embeddable({ discriminatorValue: 'admin' })
class RoleAdmin extends Role<'admin'> {

  [Config]?: DefineConfig<{ forceObject: true }>;

  @ManyToOne(() => Group, { ref: true })
  group!: EntityRef<Group>;


  @Property({ getter: true, persist: false })
  get fkGroup(): Opt<number> {
    return this.group.id;
  }

}

@Entity()
class User extends BaseEntity {

  @PrimaryKey()
  id!: number;

  @Embedded(() => [RoleAdmin, RoleVisitor])
  role!: RoleAdmin | RoleVisitor;

}

describe('GH #6105', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Person, Group, User],
      dbName: ':memory:',
      strict: true,
      validate: true,
      validateRequired: true,
      serialization: { forceObject: true },
    });

    await orm.schema.createSchema();
  });

  afterAll(() => orm.close(true));
  afterEach(() => orm.em.clear());

  it('should create entity with non-persited data in embeddable', async () => {
    const repo = orm.em.getRepository(Person);

    repo.create({ name: { first: 'John', last: 'Doe' } });
    await orm.em.flush();
    orm.em.clear();

    const [person] = await repo.findAll();
    expect(person.name.display).toBe('John Doe');
  });

  it('should create entity with non-persited data in embeddable (polymorphic & with relation)', async () => {
    const repoUser = orm.em.getRepository(User);
    const repoGrp = orm.em.getRepository(Group);

    const group = repoGrp.create({ name: 'group' });
    await orm.em.flush();

    repoUser.create({ role: { type: 'visitor', comment: 'just passing by' } });
    repoUser.create({ role: { type: 'admin', group } });

    await orm.em.flush();
    orm.em.clear();

    const [user1, user2] = await repoUser.findAll();

    expect(user1.role.type).toBe('visitor');
    expect(user2.role.type).toBe('admin');

    const roleAdmin = user2.role as RoleAdmin;
    expect(roleAdmin.group.id).toBe(group.id);
    expect(roleAdmin.fkGroup).toBe(group.id);

    // "Serialized" object
    const userObject = user2.toObject();
    expect(userObject.role.type).toBe('admin');

    const roleAdminObject = userObject.role as EntityDTO<RoleAdmin>;
    expect(roleAdminObject.group.id).toBe(group.id);
    expect(roleAdminObject.fkGroup).toBe(group.id);
  });
});
