import 'reflect-metadata';
import { Entity, ManyToMany, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { Collection, MikroORM, PopulateHint } from '@mikro-orm/sqlite';

@Entity()
class User {
  @PrimaryKey()
  id!: number;

  @Property()
  name: string;

  @ManyToMany(() => Role, 'users', { owner: true })
  roles = new Collection<Role>(this);

  constructor(name: string) {
    this.name = name;
  }
}

@Entity()
class Role {
  @PrimaryKey()
  id!: number;

  @Property()
  title: string;

  @ManyToMany(() => User, 'roles')
  users = new Collection<User>(this);

  constructor(title: string) {
    this.title = title;
  }
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [User, Role],
    metadataProvider: ReflectMetadataProvider,
  });
  await orm.schema.refresh();
});

beforeEach(async () => {
  const role1 = orm.em.create(Role, { title: 'Admin' });
  const role2 = orm.em.create(Role, { title: 'User' });

  orm.em.create(User, { name: 'User 1', roles: [role1, role2] });
  orm.em.create(User, { name: 'User 2', roles: [role2] });

  await orm.em.flush();
  orm.em.clear();
});

afterAll(async () => {
  await orm.close(true);
});

test('many-to-many filter in multi-condition $and resolves pivot join alias correctly when using joined strategy and populateWhere INFER', async () => {
  const filteredQuery = await orm.em.findAll(User, {
    where: {
      $and: [{ roles: { id: { $in: [1] } } }, { name: { $like: 'User%' } }],
    },
    populate: ['roles'],
    strategy: 'joined',
    populateWhere: PopulateHint.INFER,
  });
  expect(filteredQuery.length).toBe(1);
});
