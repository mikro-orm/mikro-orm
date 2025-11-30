import { MikroORM, Hidden, Opt, wrap } from '@mikro-orm/sqlite';

import { Embeddable, Embedded, Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
@Embeddable()
class Address {

  @Property({ hidden: true })
  addressLine1!: Hidden & string;

  @Property({ hidden: true })
  addressLine2!: Hidden<string>;

  @Property({ persist: false })
  get address(): Opt<string> {
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

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: ':memory:',
    entities: [Organization],
  });
  await orm.schema.create();
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

  // @ts-expect-error
  expect(wrap(org).toObject().address.addressLine1).toBeUndefined();
  // @ts-expect-error
  expect(wrap(org).toObject().address.addressLine2).toBeUndefined();
});
