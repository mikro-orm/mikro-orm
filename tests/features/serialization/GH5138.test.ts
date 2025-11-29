import { Collection, MikroORM, wrap } from '@mikro-orm/sqlite';

import { Entity, ManyToMany, ManyToOne, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
@Entity()
class School {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

}

@Entity()
class User {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

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
    metadataProvider: ReflectMetadataProvider,
    entities: [User],
    dbName: ':memory:',
    ensureDatabase: { create: true },
  });

  orm.em.create(User, {
    id: 1,
    name: 'u',
    roles: [{}, {}],
    school: { name: 's' },
  });

  await orm.em.flush();
  orm.em.clear();
});

beforeEach(() => orm.em.clear());
afterAll(() => orm.close());

test('lazy em.populate on m:n', async () => {
  const user = await orm.em.findOneOrFail(User, { id: 1 }, { populate: ['school'] });
  await orm.em.populate(user, ['roles']);
  const dto = wrap(user).toObject();
  expect(dto).toEqual({
    id: 1,
    name: 'u',
    roles: [{ id: 1 }, { id: 2 }],
    school: { id: 1, name: 's' },
  });
});

test('lazy em.populate with partial loading', async () => {
  const user = await orm.em.findOneOrFail(User, { id: 1 }, {});
  await orm.em.populate(user, ['school'], { fields: ['school.name'] });
  const dto = wrap(user).toObject();
  expect(dto).toEqual({
    id: 1,
    name: 'u',
    school: { id: 1, name: 's' },
  });
});
