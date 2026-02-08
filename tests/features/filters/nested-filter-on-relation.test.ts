import {
  Entity,
  Filter,
  ManyToOne,
  OneToMany,
  PrimaryKey,
  Property,
  ReflectMetadataProvider,
} from '@mikro-orm/decorators/legacy';
import { BaseEntity, Collection, MikroORM, Rel } from '@mikro-orm/sqlite';

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
  name: 'notDeleted',
  cond: () => ({ deletedAt: null }),
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

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [Company, Location, User, Client, ClientManagementObject],
    loadStrategy: 'select-in',
    autoJoinRefsForFilters: false,
    metadataProvider: ReflectMetadataProvider,
  });
});

afterAll(async () => {
  await orm.close(true);
});

beforeEach(async () => {
  await orm.schema.refresh();
});

test('nested filter condition incorrectly serialized as JSON during population', async () => {
  const company = orm.em.create(Company, { name: 'Company 1' });
  const location = orm.em.create(Location, { name: 'Location 1', company });
  const user = orm.em.create(User, { name: 'User 1', location });
  const client = orm.em.create(Client, { name: 'Client 1' });
  orm.em.create(ClientManagementObject, { name: 'CMO 1', client, owner: user });

  await orm.em.flush();
  orm.em.clear();

  orm.em.setFilterParams('byLocation', { locations: [location.id] });

  const results = await orm.em.find(
    ClientManagementObject,
    {},
    { filters: ['byLocation', 'notDeleted'], populate: ['client'] },
  );

  expect(results).toHaveLength(1);
  expect(results[0].client).not.toBeNull();
});
