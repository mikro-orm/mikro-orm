import { Collection, Entity, ManyToMany, ManyToOne, MikroORM, OneToMany, PrimaryKey, Property } from '@mikro-orm/sqlite';

@Entity()
class PrivilegeGroup {

  @PrimaryKey()
  id!: number;

  @OneToMany({ entity: () => Privilege, mappedBy: 'group' })
  privileges = new Collection<Privilege>(this);

  @Property()
  name: string;

  constructor(name: string) {
    this.name = name;
  }

}

@Entity()
class Privilege {

  @PrimaryKey()
  id!: number;

  @ManyToMany({ entity: () => User, mappedBy: 'privileges' })
  users = new Collection<User>(this);

  @ManyToOne({ entity: () => PrivilegeGroup })
  group!: PrivilegeGroup;

  @Property()
  name: string;

  constructor(name: string) {
    this.name = name;
  }

}

@Entity({ discriminatorColumn: 'type' })
class User {

  @PrimaryKey()
  id!: number;

  @ManyToMany({ entity: () => Privilege })
  privileges = new Collection<Privilege>(this);

  @Property()
  name: string;

  @Property({ unique: true })
  email: string;

  constructor(name: string, email: string) {
    this.name = name;
    this.email = email;
  }

}

@Entity()
class SuperUser extends User {}

@Entity()
class AdminUser extends User {}

let orm: MikroORM;

beforeAll(async () => {
  // It should create a pivot table using privilege_id and user_id columns.
  // Instead, it creates a pivot table using privilege_id and admin_user_id columns.
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [User, Privilege, PrivilegeGroup, SuperUser, AdminUser],
  });
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

test('M:N collection and STI', async () => {
  const superUser = orm.em.create(SuperUser, { name: 'Foo', email: 'foo' });
  const privilegeGroup = orm.em.create(PrivilegeGroup, { name: 'group' });
  const privilegeRead = orm.em.create(Privilege, {
    name: 'read',
    group: privilegeGroup,
  });
  const privilegeWrite = orm.em.create(Privilege, {
    name: 'write',
    group: privilegeGroup,
  });

  privilegeGroup.privileges.map(p => superUser.privileges.add(p));
  await orm.em.flush();
  orm.em.clear();
});
