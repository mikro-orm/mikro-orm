import type { Rel } from '@mikro-orm/sqlite';
import { BaseEntity, Collection, MikroORM } from '@mikro-orm/sqlite';
import {
  Entity,
  Filter,
  ManyToOne,
  OneToMany,
  PrimaryKey,
  Property,
  ReflectMetadataProvider,
} from '@mikro-orm/decorators/legacy';

@Entity()
class Location extends BaseEntity {
  @PrimaryKey({ autoincrement: true })
  readonly id!: number;

  @Property()
  name!: string;
}

@Entity()
class User extends BaseEntity {
  @PrimaryKey({ autoincrement: true })
  readonly id!: number;

  @Property()
  name!: string;

  @ManyToOne(() => Location)
  location!: Rel<Location>;
}

@Entity()
@Filter({
  name: 'location',
  cond: ({ location }) => ({ user: { location } }),
  default: true,
})
class ManagementObject extends BaseEntity {
  @PrimaryKey({ autoincrement: true })
  readonly id!: number;

  @Property()
  status!: string;

  @ManyToOne(() => Mobile)
  mobile!: Rel<Mobile>;

  @ManyToOne(() => User, { nullable: true })
  user?: Rel<User>;
}

@Entity()
@Filter({
  name: 'auth',
  cond: ({ location }) => ({ managementObjects: { user: { location } } }),
  default: true,
})
@Filter({
  name: 'status',
  cond: { managementObjects: { status: { $in: ['active', 'pending'] } } },
  default: true,
})
class Mobile extends BaseEntity {
  @PrimaryKey({ autoincrement: true })
  readonly id!: number;

  @Property()
  name!: string;

  @OneToMany(() => ManagementObject, mo => mo.mobile)
  managementObjects = new Collection<ManagementObject>(this);
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [Location, User, Mobile, ManagementObject],
    metadataProvider: ReflectMetadataProvider,
  });
  await orm.schema.create();
});

afterAll(async () => {
  await orm.close(true);
});

test('filter on auto-joined entity binds nested relation to its own join branch (GH #8210)', async () => {
  const location = orm.em.create(Location, { name: 'Location 1' });
  const user = orm.em.create(User, { name: 'User 1', location });
  const mobile = orm.em.create(Mobile, { name: 'Mobile 1' });
  orm.em.create(ManagementObject, { mobile, user, status: 'active' });
  const location2 = orm.em.create(Location, { name: 'Location 2' });
  const user2 = orm.em.create(User, { name: 'User 2', location: location2 });
  const mobile2 = orm.em.create(Mobile, { name: 'Mobile 2' });
  orm.em.create(ManagementObject, { mobile: mobile2, user: user2, status: 'active' });
  await orm.em.flush();
  orm.em.clear();

  orm.em.setFilterParams('location', { location: location.id });
  orm.em.setFilterParams('auth', { location: location.id });

  const mobiles = await orm.em.find(Mobile, {});
  expect(mobiles.map(m => m.name)).toEqual(['Mobile 1']);
});
