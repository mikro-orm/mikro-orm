import { Collection, Entity, ManyToMany, ManyToOne, MikroORM, PrimaryKey, wrap } from '@mikro-orm/sqlite';

@Entity()
class School {

  @PrimaryKey()
  id!: number;

}

@Entity()
class User {

  @PrimaryKey()
  id!: number;

  @ManyToMany({
    entity: () => Role,
    pivotEntity: () => UserRole,
  })
  roles = new Collection<Role>(this);

  @ManyToOne(() => School, { nullable: true })
  school?: School;

}

@Entity()
class Role {

  @PrimaryKey()
  id!: number;

  @ManyToMany(() => User, u => u.roles)
  users = new Collection<User>(this);

}

@Entity()
class UserRole {

  @ManyToOne(() => User, { primary: true, deleteRule: 'cascade' })
  user!: User;

  @ManyToOne(() => Role, { primary: true, deleteRule: 'cascade' })
  role!: Role;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [User],
    dbName: ':memory:',
    ensureDatabase: { create: true },
  });
});

afterAll(() => orm.close());

test('lazy em.populate on m:n', async () => {
  const a = orm.em.create(User, {
    id: 1,
    roles: [{}, {}],
    school: {},
  });

  await orm.em.flush();
  orm.em.clear();

  const user = await orm.em.findOneOrFail(User, { id: 1 }, { populate: ['school'] });
  await orm.em.populate(user, ['roles']);
  const dto = wrap(user).toObject();
  expect(dto).toEqual({
    id: 1,
    roles: [{ id: 1 }, { id: 2 }],
    school: { id: 1 },
  });
});
