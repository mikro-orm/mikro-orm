import {
  Collection,
  MikroORM,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryKey,
  Ref,
  OneToOne,
  Property,
} from '@mikro-orm/sqlite';

@Entity()
class Account {

  @PrimaryKey()
  id!: number;

  @Property()
  email!: string;

  @OneToOne(() => BillingDetail, x => x.account, {
    ref: true,
  })
  billingDetail!: Ref<BillingDetail>;

}

@Entity()
class BillingDetail {

  @PrimaryKey()
  id!: number;

  @Property()
  address!: string;

  @OneToOne(() => Account, {
    owner: true,
    ref: true,
  })
  account!: Ref<Account>;

}

@Entity()
class Event {

  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Account, { ref: true })
  createdBy!: Ref<Account>;

  @OneToMany(() => Notification, x => x.event)
  notifications = new Collection<Notification>(this);

}

@Entity()
class Notification {

  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Event, { ref: true })
  event!: Ref<Event>;

  @ManyToOne(() => Account, { ref: true })
  account!: Ref<Account>;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Notification],
    dbName: ':memory:',
  });
  await orm.schema.createSchema();

  const account = orm.em.create(Account, {
    email: 'example@example.com',
    billingDetail: {
      address: '123 Main St',
    },
  });
  orm.em.create(Event, {
    createdBy: account,
    notifications: [
      { account },
    ],
  });

  await orm.em.flush();
  orm.em.clear();
});

afterAll(async () => {
  await orm.close(true);
});

test('qb.leftJoinAndSelect', async () => {
  const qb = orm.em.createQueryBuilder(Event, 'e0')
    .select(['e0.id'])
    .leftJoinAndSelect('e0.createdBy', 'e1', undefined, ['e1.id'])
    .leftJoinAndSelect('e0.notifications', 'e2', undefined, ['e2.id'])
    .leftJoinAndSelect('e2.account', 'e3', undefined, ['e3.id'])
    .leftJoinAndSelect('e3.billingDetail', 'e4', undefined, ['e4.id']);

  const result = await qb.getResultList();
  expect(result[0].notifications.$.getItems()[0].account.$.billingDetail.$.id).toBe(1);
});
