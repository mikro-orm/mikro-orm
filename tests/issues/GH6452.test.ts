import { MikroORM } from '@mikro-orm/postgresql';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
class User {

  @PrimaryKey()
  id!: string;

  @Property()
  name: string;

  @Property({ unique: true })
  email: string;

  constructor(id: string, name: string, email: string) {
    this.id = id;
    this.name = name;
    this.email = email;
  }

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: ':memory:',
    entities: [User],
  });
  await orm.schema.refreshDatabase();
});

beforeEach(async () => {
  await orm.em.nativeDelete(User, {});
});

afterAll(async () => {
  await orm.close(true);
});

test('where with $not when querying for ID as string', async () => {
  const id = '1';
  orm.em.create(User, { id, name: 'Foo', email: 'foo' });
  await orm.em.flush();
  orm.em.clear();

  const query = orm.em.createQueryBuilder(User);
  query.where({ $not: { id } });
  const result = await query.getResult();

  expect(result).toHaveLength(0);
});

test('where with $not when querying for ID with $eq', async () => {
  const id = '1';
  orm.em.create(User, { id, name: 'Bar', email: 'bar' });
  await orm.em.flush();
  orm.em.clear();

  const query = orm.em.createQueryBuilder(User);
  query.where({ $not: { id: { $eq: id } } });
  const result = await query.getResult();

  // ✅ This passes (note that we are using $eq)
  expect(result).toHaveLength(0);
});

test('where with $not when querying for something other than ID', async () => {
  const id = '1';
  orm.em.create(User, { id, name: 'Bar', email: 'bar' });
  await orm.em.flush();
  orm.em.clear();

  const query = orm.em.createQueryBuilder(User);
  query.where({ $not: { name: 'Bar' } });
  const result = await query.getResult();

  // ✅ This passes, note that we are not using the ID field in the filter
  expect(result).toHaveLength(0);
});
