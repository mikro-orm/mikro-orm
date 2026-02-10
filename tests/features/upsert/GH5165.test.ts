import { Ref, MikroORM, Collection } from '@mikro-orm/sqlite';
import {
  Entity,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryKey,
  Property,
  ReflectMetadataProvider,
  Unique,
} from '@mikro-orm/decorators/legacy';

@Entity({ tableName: 'servers_clients_tags' })
@Unique({
  properties: ['purchase', 'name'],
})
class Note {
  @PrimaryKey()
  readonly id?: number;

  @ManyToOne(() => Purchases, {
    nullable: false,
  })
  purchase?: Ref<Purchases>;

  @Property({ length: 100 })
  name!: string;

  @Property({ length: 2000 })
  value!: string;
}

@Entity()
class Purchases {
  @PrimaryKey()
  readonly id?: number;

  @ManyToOne({ entity: () => Account, ref: true })
  account?: Ref<Account>;

  @OneToMany(() => Note, x => x.purchase)
  notes = new Collection<Note>(this);
}

@Entity()
class Account {
  @PrimaryKey()
  readonly id?: number;

  @OneToOne(() => Address, billingDetail => billingDetail.account, {
    ref: true,
    nullable: true,
  })
  address?: Ref<Address>;

  @OneToMany(() => Purchases, x => x.account)
  serverClients = new Collection<Purchases>(this);
}

@Entity()
class Address {
  @PrimaryKey()
  readonly id?: number;

  @Property({ length: 100 })
  company!: string;

  @OneToOne({
    entity: () => Account,
    unique: 'billing_details_account_id_key',
    owner: true,
    ref: true,
  })
  account!: Ref<Account>;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [Note, Purchases, Account, Address],
    dbName: ':memory:',
    loadStrategy: 'select-in',
  });
  await orm.schema.refresh();
  const billingDetail = orm.em.create(Address, {
    company: 'testBillingDetail',
    account: orm.em.create(Account, {}),
  });

  const serverClient = orm.em.create(Purchases, {
    account: billingDetail.account,
  });

  orm.em.create(Note, {
    purchase: serverClient,
    name: 'testKey',
    value: 'testValue',
  });
  await orm.em.flush();
});

afterAll(async () => {
  await orm.close(true);
});

test(`GH issue 5165 upsert one`, async () => {
  const purchase = await orm.em.findOneOrFail(
    Purchases,
    { id: 1 },
    {
      populate: ['notes'],
    },
  );
  await orm.em.upsert(Note, {
    purchase,
    name: 'testKey',
    value: 'newTestValue',
  });
});

test(`GH issue 5165 upsert many`, async () => {
  const purchase = await orm.em.findOneOrFail(
    Purchases,
    { id: 1 },
    {
      populate: ['notes'],
    },
  );
  await orm.em.upsertMany(Note, [
    {
      purchase,
      name: 'testKey',
      value: 'newTestValue',
    },
    {
      purchase,
      name: 'testKey2',
      value: 'newTestValue2',
    },
  ]);
});
