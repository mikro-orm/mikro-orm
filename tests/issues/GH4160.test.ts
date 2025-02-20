import { Collection, Entity, LoadStrategy, ManyToOne, OneToMany, OneToOne, OptionalProps, PrimaryKey, Property, Rel } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/sqlite';

@Entity()
class Account {

  [OptionalProps]?: 'client';

  @PrimaryKey()
  id!: string;

  @Property()
  name!: string;

  @OneToOne(() => Client, c => c.account)
  client!: Rel<Client>;

}

@Entity()
class Client {

  @OneToOne({ primary: true, entity: () => Account })
  account!: Account;

  @OneToMany(() => Brand, brand => brand.client, { orphanRemoval: true })
  brands = new Collection<Brand>(this);

}

@Entity()
class Brand {

  @PrimaryKey()
  id!: string;

  @ManyToOne(() => Client)
  client!: Client;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Client, Account, Brand],
    dbName: ':memory:',
  });
  await orm.schema.refreshDatabase();

  const account1 = orm.em.create(Account, { name: 'Account 1', id: '1' });
  const client1 = orm.em.create(Client, { account: account1 });
  orm.em.create(Brand, { id: '1', client: client1 });
  orm.em.create(Brand, { id: '2', client: client1 });
  await orm.em.flush();
});

beforeEach(async () => {
  orm.em.clear();
});

afterAll(async () => {
  await orm.close(true);
});

it('populate with select-in strategy', async () => {
  const brands1 = await orm.em.find(Brand, {}, {
    populate: ['client.account'],
    strategy: LoadStrategy.SELECT_IN,
  });

  expect(brands1[0].client.account).toMatchObject({ id: '1', name: 'Account 1' });
  expect(brands1[1].client.account).toMatchObject({ id: '1', name: 'Account 1' });
});

it('populate with joined strategy', async () => {
  const brands1 = await orm.em.find(Brand, {}, {
    populate: ['client.account'],
    strategy: LoadStrategy.JOINED,
  });

  expect(brands1[0].client.account).toMatchObject({ id: '1', name: 'Account 1' });
  expect(brands1[1].client.account).toMatchObject({ id: '1', name: 'Account 1' });
});

it('populate with query builder', async () => {
  const brands2 = await orm.em
    .createQueryBuilder(Brand, 'brand')
    .leftJoinAndSelect('brand.client', 'client')
    .leftJoinAndSelect('client.account', 'account')
    .getResult();

  expect(brands2[0].client.account).toMatchObject({ id: '1', name: 'Account 1' });
  expect(brands2[1].client.account).toMatchObject({ id: '1', name: 'Account 1' });
});
