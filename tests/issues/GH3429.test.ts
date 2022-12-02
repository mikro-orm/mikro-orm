import { SqliteDriver } from '@mikro-orm/sqlite';
import { MikroORM, Embeddable, Embedded, Entity, PrimaryKey, Property } from '@mikro-orm/core';

@Embeddable()
class Address {

  @Property({ hidden: true })
  addressLine1!: string;

  @Property({ hidden: true })
  addressLine2!: string;

  @Property({ persist: false })
  get address() {
    return [this.addressLine1, this.addressLine2].join(' ');
  }

  @Property()
  city!: string;

  @Property()
  country!: string;

}

@Entity()
export class Organization {

  @PrimaryKey()
  id!: number;

  @Embedded(() => Address, { object: true })
  address!: Address;

}

let orm: MikroORM<SqliteDriver>;

beforeAll(async () => {
  orm = await MikroORM.init({
    driver: SqliteDriver,
    dbName: ':memory:',
    entities: [Organization],
  });
  await orm.schema.createSchema();
});

afterAll(async () => {
  await orm.close();
});

test('embeddable serialization flags', async () => {
  const org = orm.em.create(Organization, {
    address: {
      addressLine1: 'l1',
      addressLine2: 'l2',
      city: 'city 1',
      country: 'country 1',
    },
  });
  await orm.em.persistAndFlush(org);

  expect(JSON.stringify(org)).toBe(`{"id":1,"address":{"city":"city 1","country":"country 1","address":"l1 l2"}}`);
  expect(JSON.stringify([org])).toBe(`[{"id":1,"address":{"city":"city 1","country":"country 1","address":"l1 l2"}}]`);
});
