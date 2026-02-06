import {
  BaseEntity,
  Collection,
  Entity,
  Filter,
  ManyToOne,
  MikroORM,
  OneToMany,
  PrimaryKey,
  Property,
  Rel,
} from '@mikro-orm/sqlite';

@Entity()
class Company extends BaseEntity {

  @PrimaryKey({ autoincrement: true })
  readonly id!: number;

  @Property()
  name!: string;

}

@Entity()
class Location extends BaseEntity {

  @PrimaryKey({ autoincrement: true })
  readonly id!: number;

  @Property()
  name!: string;

  @ManyToOne(() => Company)
  company!: Rel<Company>;

}

@Entity()
@Filter({
  name: 'byLocation',
  cond: ({ locations }) => ({
    location: locations,
  }),
})
class User extends BaseEntity {

  @PrimaryKey({ autoincrement: true })
  readonly id!: number;

  @Property()
  name!: string;

  @ManyToOne(() => Location)
  location!: Rel<Location>;

  @Property({ default: true })
  active!: boolean;

}

@Entity()
@Filter({
  name: 'byLocation',
  cond: ({ locations }) => ({
    owner: {
      location: locations,
    },
  }),
})
@Filter({
  name: 'onlyActive',
  cond: () => ({ deletedAt: null, owner: { active: true } }),
})
@Filter({
  name: 'onlyActive2',
  cond: () => ({ $and: [{ deletedAt: null }, { owner: { active: true } }] }),
})
class ClientManagementObject extends BaseEntity {

  @PrimaryKey({ autoincrement: true })
  readonly id!: number;

  @Property({ nullable: true })
  deletedAt?: Date;

  @Property()
  name!: string;

  @ManyToOne(() => Client)
  client!: Rel<Client>;

  @ManyToOne(() => User)
  owner!: Rel<User>;

}

@Entity()
@Filter({
  name: 'byLocation',
  cond: ({ locations }) => ({
    managementObjects: {
      owner: {
        location: locations,
      },
    },
  }),
})
class Client extends BaseEntity {

  @PrimaryKey({ autoincrement: true })
  readonly id!: number;

  @Property()
  name!: string;

  @OneToMany(() => ClientManagementObject, cmo => cmo.client)
  managementObjects = new Collection<ClientManagementObject>(this);

}

describe('Filter on relationship no', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      dbName: ':memory:',
      entities: [Company, Location, User, Client, ClientManagementObject],
      loadStrategy: 'select-in',
      autoJoinRefsForFilters: false,
    });
  });

  afterAll(async () => {
    await orm.close(true);
  });

  beforeEach(async () => {
    await orm.schema.dropSchema();
    await orm.schema.createSchema();
  });

  // BUG: When multiple filters are active (byLocation + onlyActive) it produces invalid SQL:
  //   ... and (`c1`.`deleted_at` is null and ())
  test('nested filters produce empty ())', async () => {
    const company = orm.em.create(Company, { name: 'Company 1' });
    const location = orm.em.create(Location, { name: 'Location 1', company });
    const user = orm.em.create(User, { name: 'User 1', location, active: true });
    const user2 = orm.em.create(User, { name: 'User 1', location, active: false });
    const client = orm.em.create(Client, { name: 'Client 1' });
    orm.em.create(ClientManagementObject, { name: 'CMO 1', client, owner: user });
    orm.em.create(ClientManagementObject, { name: 'CMO 2', client, owner: user2 });

    await orm.em.flush();
    orm.em.clear();

    orm.em.setFilterParams('byLocation', { locations: [location.id] });

    const results = await orm.em.find(
      Client,
      {},
      { filters: ['byLocation', 'onlyActive'], populate: ['managementObjects'] },
    );

    // Main query finds the CMO correctly
    expect(results).toHaveLength(1);
    expect(results[0].managementObjects).toHaveLength(1);
  });

  // WORKS: onlyActive2 wraps conditions in explicit $and at the filter level.
  test('filter working when wrapped in $and', async () => {
    const company = orm.em.create(Company, { name: 'Company 1' });
    const location = orm.em.create(Location, { name: 'Location 1', company });
    const user = orm.em.create(User, { name: 'User 1', location, active: true });
    const user2 = orm.em.create(User, { name: 'User 1', location, active: false });
    const client = orm.em.create(Client, { name: 'Client 1' });
    orm.em.create(ClientManagementObject, { name: 'CMO 1', client, owner: user });
    orm.em.create(ClientManagementObject, { name: 'CMO 2', client, owner: user2 });

    await orm.em.flush();
    orm.em.clear();

    orm.em.setFilterParams('byLocation', { locations: [location.id] });

    const results = await orm.em.find(
      Client,
      {},
      { filters: ['byLocation', 'onlyActive2'], populate: ['managementObjects'] },
    );

    // Main query finds the CMO correctly
    expect(results).toHaveLength(1);
    expect(results[0].managementObjects).toHaveLength(1);
  });
});
