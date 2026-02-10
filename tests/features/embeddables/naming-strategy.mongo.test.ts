import { MikroORM, ObjectId, UnderscoreNamingStrategy } from '@mikro-orm/mongodb';
import {
  Embeddable,
  Embedded,
  Entity,
  PrimaryKey,
  Property,
  SerializedPrimaryKey,
  ReflectMetadataProvider,
} from '@mikro-orm/decorators/legacy';

@Embeddable()
class Address {
  @Property()
  street!: string;

  @Property()
  city!: string;

  @Property()
  isPrimary: boolean = false;
}

@Entity()
class User {
  @PrimaryKey()
  _id!: ObjectId;

  @SerializedPrimaryKey()
  id!: string;

  @Property()
  name!: string;

  @Property({ unique: true })
  email!: string;

  @Embedded({ entity: () => Address, object: true, nullable: true })
  currentAddress?: Address;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: 'naming-strategy-test',
    entities: [User, Address],
    namingStrategy: UnderscoreNamingStrategy,
    metadataProvider: ReflectMetadataProvider,
  });
  await orm.schema.refresh();
});

afterAll(async () => {
  await orm.close(true);
});

test('basic CRUD example', async () => {
  orm.em.create(User, {
    name: 'Foo',
    email: 'foo',
    currentAddress: { city: 'some', street: '123 Main St', isPrimary: true },
  });
  await orm.em.flush();
  orm.em.clear();

  const user = await orm.em.findOneOrFail(User, { email: 'foo', currentAddress: { isPrimary: true } });
  expect(user.name).toBe('Foo');
  user.name = 'Bar';
  orm.em.remove(user);
  await orm.em.flush();

  const count = await orm.em.count(User, { email: 'foo' });
  expect(count).toBe(0);
});
