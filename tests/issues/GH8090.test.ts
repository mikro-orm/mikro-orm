import type { Rel } from '@mikro-orm/postgresql';
import { BaseEntity, Collection, MikroORM } from '@mikro-orm/postgresql';
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
@Filter({
  name: 'auth',
  cond: ({ company, locations }) => ({
    $or: [{ id: company }, { locations }],
  }),
})
class Company extends BaseEntity {
  @PrimaryKey({ autoincrement: true })
  readonly id!: number;

  @Property()
  code!: string;

  @OneToMany(() => Location, location => location.company)
  locations = new Collection<Location>(this);
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
class Product extends BaseEntity {
  @PrimaryKey({ autoincrement: true })
  readonly id!: number;

  @Property()
  name!: string;

  @ManyToOne(() => Company)
  company!: Rel<Company>;
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
  name: 'auth',
  cond: ({ company, locations }) => ({
    $or: [{ company }, { user: { location: locations } }],
  }),
})
class ClientManagementObject extends BaseEntity {
  @PrimaryKey({ autoincrement: true })
  readonly id!: number;

  @ManyToOne(() => Client)
  client!: Rel<Client>;

  @ManyToOne(() => User, { nullable: true })
  user?: Rel<User>;

  @ManyToOne(() => Company)
  company!: Rel<Company>;
}

@Entity()
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
    dbName: 'mikro_orm_test_gh_8090',
    entities: [Company, Location, Product, User, Client, ClientManagementObject],
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

test('filter referencing to-many relation on auto-joined entity', async () => {
  const company = orm.em.create(Company, { code: 'ACME' });
  orm.em.create(Location, { name: 'Location 1', company });
  orm.em.create(Product, { name: 'Product 1', company });

  // matches the filter only via the `locations` leg of the `$or` condition
  const company2 = orm.em.create(Company, { code: 'ACME' });
  const location2 = orm.em.create(Location, { name: 'Location 2', company: company2 });
  orm.em.create(Product, { name: 'Product 2', company: company2 });

  // matches neither leg
  const company3 = orm.em.create(Company, { code: 'ACME' });
  orm.em.create(Location, { name: 'Location 3', company: company3 });
  orm.em.create(Product, { name: 'Product 3', company: company3 });

  await orm.em.flush();
  orm.em.clear();

  orm.em.setFilterParams('auth', { company: [company.id], locations: [location2.id] });

  const products = await orm.em.find(
    Product,
    { company: { code: 'ACME' } },
    { filters: ['auth'], orderBy: { name: 'asc' } },
  );
  expect(products.map(p => p.name)).toEqual(['Product 1', 'Product 2']);
});

test('filter referencing a relation resolved via populate alias', async () => {
  const company = orm.em.create(Company, { code: 'ACME' });
  const location = orm.em.create(Location, { name: 'Location 1', company });
  const user = orm.em.create(User, { name: 'User 1', location });
  const client = orm.em.create(Client, { name: 'Client 1' });
  orm.em.create(ClientManagementObject, { client, user, company });

  await orm.em.flush();
  orm.em.clear();

  orm.em.setFilterParams('auth', { company: [company.id], locations: [location.id] });

  const clients = await orm.em.find(
    Client,
    {},
    { filters: ['auth'], populate: ['managementObjects.user.location'], strategy: 'joined' },
  );
  expect(clients).toHaveLength(1);
  expect(clients[0].managementObjects).toHaveLength(1);
});
