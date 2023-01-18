import { Entity, LoadStrategy, MikroORM, OneToOne, PrimaryKey, Property } from '@mikro-orm/core';
import { SqliteDriver } from '@mikro-orm/sqlite';

@Entity()
export class Checkout {

  @PrimaryKey()
  id!: number;

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

@Entity()
export class Checkout2 {

  @PrimaryKey()
  id!: number;

  @OneToOne(() => Discount2, discount => discount.checkout, {
    nullable: true,
    orphanRemoval: true,
  })
  discount?: any;

}

@Entity()
export class Discount2 {

  @PrimaryKey()
  id!: number;

  @OneToOne(() => Checkout2)
  checkout!: Checkout2;

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
      driver: SqliteDriver,
      dbName: ':memory:',
      entities: [Discount, Checkout, Discount2, Checkout2],
    });
  });

  beforeEach(async () => {
    await orm.schema.dropSchema();
    await orm.schema.createSchema();
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

  it('Should be able to orphan remove discount from checkout', async () => {
    const createdCheckout = new Checkout2();
    createdCheckout.discount = new Discount2(25);

    await orm.em.fork().persistAndFlush(createdCheckout);

    {
      // Remove the discount by setting it to null
      const em = orm.em.fork();
      const checkout = await em.findOneOrFail(Checkout2, createdCheckout.id, {
        populate: ['discount'],
        strategy: LoadStrategy.JOINED,
      });

      const discount = checkout.discount;
      checkout.discount = null;
      expect(checkout.discount).toBeNull();
      expect(discount.checkout).toBeNull();
      await em.flush();
    }

    {
      // Verify checkout.discount is destroyed
      const checkout = await orm.em.fork().findOneOrFail(Checkout2, createdCheckout.id, {
        populate: ['discount'],
        strategy: LoadStrategy.JOINED,
      });
      expect(checkout.discount).toBeNull();
      const discounts = await orm.em.fork().find(Discount2, {});
      expect(discounts).toHaveLength(0);
    }
  });

});
