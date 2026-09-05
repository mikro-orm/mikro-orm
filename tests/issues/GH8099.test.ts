import type { Rel } from '@mikro-orm/postgresql';
import { MikroORM } from '@mikro-orm/postgresql';
import { Entity, Filter, ManyToOne, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
class Company {
  @PrimaryKey({ autoincrement: true })
  id!: number;

  @Property()
  code!: string;
}

@Entity()
@Filter({ name: 'auth', cond: ({ company }) => ({ company }), default: true })
class Location {
  @PrimaryKey({ autoincrement: true })
  id!: number;

  @ManyToOne(() => Company)
  company!: Rel<Company>;
}

@Entity()
@Filter({
  name: 'auth',
  cond: ({ company }) => ({ location: { company } }),
  default: true,
})
@Filter({
  name: 'deep',
  cond: () => ({ location: { company: { code: 'ACME' } } }),
})
class User {
  @PrimaryKey({ autoincrement: true })
  id!: number;

  @ManyToOne(() => Location)
  location!: Rel<Location>;
}

@Entity()
@Filter({
  name: 'auth',
  cond: ({ company }) => ({ user: { location: { company } } }),
  default: true,
})
class Grant {
  @PrimaryKey({ autoincrement: true })
  id!: number;

  @ManyToOne(() => User)
  user!: Rel<User>;
}

let orm: MikroORM;
let companyId: number;
let grantId: number;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: 'mikro_orm_test_gh_8099',
    entities: [Company, Location, User, Grant],
    metadataProvider: ReflectMetadataProvider,
  });
  await orm.schema.refresh();

  const em = orm.em.fork();
  const company1 = em.create(Company, { code: 'ACME' });
  const company2 = em.create(Company, { code: 'OTHER' });
  const location1 = em.create(Location, { company: company1 });
  const location2 = em.create(Location, { company: company2 });
  const user1 = em.create(User, { location: location1 });
  const user2 = em.create(User, { location: location2 });
  const grant1 = em.create(Grant, { user: user1 });
  em.create(Grant, { user: user2 });
  await em.flush();
  companyId = company1.id;
  grantId = grant1.id;
});

afterAll(async () => {
  await orm.close(true);
});

test('nested filter referencing an alias created by an earlier joined path', async () => {
  const em = orm.em.fork();
  em.setFilterParams('auth', { company: companyId });

  const grants = await em.find(Grant, {}, { fields: ['id'] });
  expect(grants.map(g => g.id)).toEqual([grantId]);
});

test('nested filter referencing an alias two levels below the joined path', async () => {
  const em = orm.em.fork();

  const grants = await em.find(
    Grant,
    { user: { location: { company: companyId } } },
    { fields: ['id'], filters: { auth: false, deep: true } },
  );
  expect(grants.map(g => g.id)).toEqual([grantId]);
});
