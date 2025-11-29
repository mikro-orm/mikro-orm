import { BaseEntity, Collection, LoadStrategy, MikroORM, PopulateHint, Ref } from '@mikro-orm/postgresql';

import { Entity, ManyToOne, OneToMany, OneToOne, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
let orm: MikroORM;

@Entity()
class Client extends BaseEntity {

  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Address)
  address!: Ref<Address>;

  @OneToOne(() => AccountNotes)
  note!: Ref<AccountNotes>;

}

@Entity()
class AccountNotes extends BaseEntity {

  @PrimaryKey()
  id!: number;

  @Property()
  noteText!: string;

  @OneToOne(() => Client, employee => employee.note)
  client!: Ref<Client>;

}

@Entity()
class Address extends BaseEntity {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @OneToMany(() => Client, employee => employee.address)
  clients = new Collection<Client>(this);

  @ManyToOne(() => Country)
  country!: Ref<Country>;

}

@Entity()
class Country extends BaseEntity {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @OneToMany(() => Address, address => address.country)
  addresses = new Collection<Address>(this);

}

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: 'ghx17',
    disableIdentityMap: false,
    entities: [Client, AccountNotes, Address, Country],
    forceUndefined: true,
    populateWhere: PopulateHint.INFER,
    loadStrategy: LoadStrategy.JOINED,
  });
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

test('Merging populate fields with query builder works correctly', async () => {
  orm.em.create(Client, {
    id: 123,
    note: {
      id: 1,
      noteText: 'test note',
    },
    address: {
      id: 1,
      name: 'test address',
      country: {
        id: 1,
        name: 'Italy',
      },
    },
  });
  await orm.em.flush();
  orm.em.clear();
  await orm.em.find(Client, 123, {
    populate: ['note'],
  });

  const queryBuilder = orm.em
    .qb(Client, 'root')
    .leftJoinAndSelect('root.address', 'rel_2_address', {}, ['name'])
    .leftJoinAndSelect('rel_2_address.country', 'rel_4_country', {}, ['name']);

  const result = await queryBuilder.getResult();
  const [objectified] = result.map(r => r.toObject());

  expect(objectified.note).toBeInstanceOf(Object);
  expect(objectified.address).toBeInstanceOf(Object);
  expect(objectified.address.country).toBeInstanceOf(Object);
  expect(objectified.address.country.name).toBe('Italy');
  expect(objectified.address.name).toBe('test address');
});
