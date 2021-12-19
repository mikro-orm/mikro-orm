import { Entity, MikroORM, OneToOne, PrimaryKey, Property } from '@mikro-orm/core';

@Entity()
export class Checkout {

  @PrimaryKey()
  id!: number;

  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  @OneToOne(() => Discount, discount => discount.checkout, {
    nullable: true,
  })
  discount?: any;

}

@Entity()
export class Discount {

  @PrimaryKey()
  id!: number;

  @OneToOne(() => Checkout, checkout => checkout.discount, {
    nullable: true,
    owner: true,
  })
  checkout?: Checkout;

  @Property()
  amount: number;

  constructor(amount: number) {
    this.amount = amount;
  }

}

describe('Remove entity issue (GH 2273)', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      type: 'sqlite',
      dbName: ':memory:',
      entities: [Discount, Checkout],
    });
  });

  beforeEach(async () => {
    await orm.getSchemaGenerator().dropSchema();
    await orm.getSchemaGenerator().createSchema();
    orm.em.clear();
  });

  afterAll(async () => {
    await orm.close();
  });

  it('Should be able to remove discount from checkout', async () => {
    let checkout = new Checkout();
    checkout.discount = new Discount(1000);
    await orm.em.fork().persistAndFlush([checkout]);

    checkout = await orm.em.findOneOrFail(Checkout, checkout.id, { populate: ['discount'] });
    expect(checkout.discount?.amount).toBe(1000);

    orm.em.remove(checkout.discount!);
    await orm.em.flush();

    checkout = await orm.em.fork().findOneOrFail(Checkout, checkout.id, { populate: ['discount'] });

    expect(checkout.discount).toBeFalsy();
  });

  it('Should be able to remove discount from checkout and add new discount', async () => {
    let checkout = new Checkout();
    checkout.discount = new Discount(1000);
    await orm.em.fork().persistAndFlush([checkout]);

    checkout = await orm.em.findOneOrFail(Checkout, checkout.id, { populate: ['discount'] });
    expect(checkout.discount?.amount).toBe(1000);

    orm.em.remove(checkout.discount!);
    checkout.discount = new Discount(2000);
    await orm.em.flush();

    const newEm = orm.em.fork();
    checkout = await newEm.findOneOrFail(Checkout, checkout.id, { populate: ['discount'] });
    const discounts = await newEm.find(Discount, {});

    expect(checkout.discount?.amount).toBe(2000);
    expect(discounts.length).toBe(1);
  });
});
