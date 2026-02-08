import { BaseEntity, Collection, MikroORM, Rel } from '@mikro-orm/sqlite';
import {
  Entity,
  Filter,
  ManyToOne,
  OneToMany,
  PrimaryKey,
  Property,
  ManyToMany,
  ReflectMetadataProvider,
} from '@mikro-orm/decorators/legacy';

abstract class BE extends BaseEntity {
  @PrimaryKey({ autoincrement: true })
  readonly id!: string;
}

@Entity()
@Filter({
  name: 'test',
  cond: ({ locations }) => ({ locations }),
})
class Company extends BE {
  @Property()
  name!: string;

  @OneToMany(() => Location, location => location.company)
  locations = new Collection<Location>(this);
}

@Entity()
@Filter({
  name: 'test',
  cond: ({ locations }) => ({ id: locations }),
})
class Location extends BE {
  @Property()
  name!: string;

  @ManyToOne(() => Company)
  company!: Rel<Company>;
}

@Entity()
@Filter({
  name: 'test',
  cond: ({ locations }) => ({ location: locations }),
})
class User extends BE {
  @Property()
  name!: string;

  @ManyToOne(() => Location)
  location!: Location;

  @OneToMany(() => UserRoleBinding, userRoleBinding => userRoleBinding.user)
  userRoleBindings = new Collection<UserRoleBinding>(this);
}

@Entity()
@Filter({
  name: 'test',
  cond: ({ locations }) => ({
    $or: [{ company: { locations } }, { locations }],
  }),
})
class UserRoleBinding extends BE {
  @Property()
  role!: string;

  @ManyToOne(() => User)
  user!: User;

  @ManyToOne(() => Company, { nullable: true })
  company?: Company;

  @ManyToMany(() => Location)
  locations = new Collection<Location>(this);
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [Company, Location, User, UserRoleBinding],
    autoJoinRefsForFilters: false,
    loadStrategy: 'select-in',
    metadataProvider: ReflectMetadataProvider,
  });
});

afterAll(async () => {
  await orm.close(true);
});

beforeEach(async () => {
  await orm.schema.refresh();
});

test('nested filters with select-in', async () => {
  const company = orm.em.create(Company, { name: 'Company 1' });
  const company2 = orm.em.create(Company, { name: 'Company 2' });
  const location = orm.em.create(Location, { name: 'Location 1', company });
  const location2 = orm.em.create(Location, { name: 'Location 2', company: company2 });
  const user = orm.em.create(User, { name: 'User 1', location });
  const user2 = orm.em.create(User, { name: 'User 2', location: location2 });
  orm.em.create(UserRoleBinding, { role: 'admin', company: null, locations: [location], user });
  orm.em.create(UserRoleBinding, { role: 'user', company: company2, locations: [location2], user: user2 });

  await orm.em.flush();
  orm.em.clear();

  orm.em.setFilterParams('test', { locations: [location.id] });

  const users = await orm.em.find(User, {}, { filters: ['test'], populate: ['userRoleBindings'] });
  expect(users).toHaveLength(1);
});
