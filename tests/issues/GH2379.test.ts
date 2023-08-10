import { BigIntType, Collection, Entity, IdentifiedReference, ManyToOne, MikroORM, OneToMany, OptionalProps, PrimaryKey, Property } from '@mikro-orm/core';
import { SqliteDriver } from '@mikro-orm/sqlite';
import { performance } from 'perf_hooks';

@Entity()
export class VendorBuyerRelationship {

  [OptionalProps]?: 'created';

  @PrimaryKey({ type: BigIntType })
  id!: string;

  @Property({ onCreate: () => new Date() })
  created!: Date;

  @ManyToOne(() => Member, { wrappedReference: true })
  buyer!: IdentifiedReference<Member>;

  @ManyToOne(() => Member, { wrappedReference: true })
  vendor!: IdentifiedReference<Member>;

  @OneToMany(() => Order, o => o.buyerRel)
  orders = new Collection<Order>(this);

}

@Entity()
export class Member {

  [OptionalProps]?: 'created';

  @PrimaryKey({ type: BigIntType })
  id!: string;

  @Property({ onCreate: () => new Date() })
  created!: Date;

  @OneToMany(() => Member, member => member.parent)
  children = new Collection<Member>(this);

  @OneToMany(() => VendorBuyerRelationship, rel => rel.vendor)
  buyers = new Collection<VendorBuyerRelationship>(this);

  @OneToMany(() => Order, order => order.vendor)
  orders = new Collection<Order>(this);

  @ManyToOne(() => Member, { wrappedReference: true, nullable: true })
  parent?: IdentifiedReference<Member>;

}

@Entity()
export class Job {

  [OptionalProps]?: 'rejected';

  @PrimaryKey({ type: BigIntType })
  id!: string;

  @ManyToOne(() => Member, { wrappedReference: true, nullable: true })
  member?: IdentifiedReference<Member>;

  @ManyToOne(() => Order, { wrappedReference: true, nullable: true })
  order?: IdentifiedReference<Order>;

  @OneToMany(() => Job, job => job.parent)
  children = new Collection<Job>(this);

  @ManyToOne(() => Job, { wrappedReference: true, nullable: true })
  parent?: IdentifiedReference<Job>;

  @Property()
  rejected: boolean = false;

  @ManyToOne(() => VendorBuyerRelationship, { wrappedReference: true, nullable: true })
  buyer?: IdentifiedReference<VendorBuyerRelationship>;

  @ManyToOne(() => Job, { wrappedReference: true, nullable: true })
  delegate?: IdentifiedReference<Job>;

  @ManyToOne(() => Member, { wrappedReference: true, nullable: true })
  assignee?: IdentifiedReference<Member>;

}

@Entity()
export class Order {

  [OptionalProps]?: 'created';

  @PrimaryKey({ type: BigIntType })
  id!: string;

  @Property({ onCreate: () => new Date() })
  created!: Date;

  @ManyToOne(() => VendorBuyerRelationship, { wrappedReference: true, nullable: true })
  buyerRel?: IdentifiedReference<VendorBuyerRelationship>;

  @OneToMany(() => Job, job => job.order)
  jobs = new Collection<Job>(this);

  @ManyToOne(() => Member, { wrappedReference: true, nullable: true })
  vendor?: IdentifiedReference<Member>;

}

describe('GH issue 2379', () => {
  let orm: MikroORM<SqliteDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Order, Job, VendorBuyerRelationship, Member],
      dbName: ':memory:',
      driver: SqliteDriver,
    });
    await orm.schema.createSchema();
  });

  afterAll(() => orm.close(true));

  test('test cpu issues', async () => {
    const start = performance.now();
    const rels = [];
    const vendor = new Member();

    orm.em.persist(vendor);

    for (let i = 1; i <= 1000; i++) {
      const buyer = new Member();

      orm.em.persist(buyer);

      const rel = orm.em.create(VendorBuyerRelationship, {
        vendor,
        buyer,
      });

      rels.push(rel);
    }

    for (let i = 1; i <= 3000; i++) {
      const order = orm.em.create(Order, {
        buyerRel: rels[i % 1000],
      });

      orm.em.persist(order);

      orm.em.create(Job, {
        order,
      });
    }

    await orm.em.flush();
    orm.em.clear();

    const jobs = await orm.em.find(Job, { }, { populate: ['order'] });
    await orm.em.flush();
    const took = performance.now() - start;

    if (took > 1000) {
      process.stdout.write(`flush test took ${took}\n`);
    }
  });

});
