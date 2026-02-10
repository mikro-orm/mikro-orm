import { MikroORM } from '@mikro-orm/sqlite';
import {
  Embeddable,
  Embedded,
  Entity,
  PrimaryKey,
  Property,
  ReflectMetadataProvider,
} from '@mikro-orm/decorators/legacy';

@Embeddable()
class Address {
  @Property()
  street!: string;

  @Property()
  city!: string;
}

@Entity()
class User {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Property({ unique: true })
  email!: string;

  @Embedded(() => Address, { nullable: true })
  address?: Address;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: ':memory:',
    entities: [User],
  });
  await orm.schema.refresh();
});

afterAll(async () => {
  await orm.close(true);
});

test('GH #6966', async () => {
  orm.em.create(User, { name: 'Foo', email: 'foo', address: { street: '123 Main St', city: 'Anytown' } });
  await orm.em.flush();
  orm.em.clear();

  const user = await orm.em.findOneOrFail(User, { email: 'foo' }, { fields: ['name'] });
  orm.em.assign(user, { address: null });
  await orm.em.flush();

  const userAfter = await orm.em.findOneOrFail(User, { email: 'foo' }, { populate: ['address'] });
  expect(userAfter.address).toEqual(null);
});
