import { Collection, Entity, Ref, ManyToOne, MikroORM, OneToMany, OptionalProps, PrimaryKey, Property } from '@mikro-orm/sqlite';
import { performance } from 'node:perf_hooks';

@Entity()
class VendorBuyerRelationship {

  [OptionalProps]?: 'created';

  @PrimaryKey()
  id!: bigint;

  @Property({ onCreate: () => new Date() })
  created!: Date;

  @ManyToOne(() => Member, { ref: true })
  buyer!: Ref<Member>;

  @ManyToOne(() => Member, { ref: true })
  vendor!: Ref<Member>;

  @OneToMany(() => Order, o => o.buyerRel)
  orders = new Collection<Order>(this);

}

@Entity()
class Member {

  [OptionalProps]?: 'created';

  @PrimaryKey()
  id!: bigint;

  @Property({ onCreate: () => new Date() })
  created!: Date;

  @OneToMany(() => Member, member => member.parent)
  children = new Collection<Member>(this);

  @OneToMany(() => VendorBuyerRelationship, rel => rel.vendor)
  buyers = new Collection<VendorBuyerRelationship>(this);

  @OneToMany(() => Order, order => order.vendor)
  orders = new Collection<Order>(this);

  @ManyToOne(() => Member, { ref: true, nullable: true })
  parent?: Ref<Member>;

}

@Entity()
class Job {

  [OptionalProps]?: 'rejected';

  @PrimaryKey()
  id!: bigint;

  @ManyToOne(() => Member, { ref: true, nullable: true })
  member?: Ref<Member>;

  @ManyToOne(() => Order, { ref: true, nullable: true })
  order?: Ref<Order>;

  @OneToMany(() => Job, job => job.parent)
  children = new Collection<Job>(this);

  @ManyToOne(() => Job, { ref: true, nullable: true })
  parent?: Ref<Job>;

  @Property()
  rejected: boolean = false;

  @ManyToOne(() => VendorBuyerRelationship, { ref: true, nullable: true })
  buyer?: Ref<VendorBuyerRelationship>;

  @ManyToOne(() => Job, { ref: true, nullable: true })
  delegate?: Ref<Job>;

  @ManyToOne(() => Member, { ref: true, nullable: true })
  assignee?: Ref<Member>;

}

@Entity()
export class Order {

  [OptionalProps]?: 'created';

  @PrimaryKey()
  id!: bigint;

  @Property({ onCreate: () => new Date() })
  created!: Date;

  @ManyToOne(() => VendorBuyerRelationship, { ref: true, nullable: true })
  buyerRel?: Ref<VendorBuyerRelationship>;

  @OneToMany(() => Job, job => job.order)
  jobs = new Collection<Job>(this);

  @ManyToOne(() => Member, { ref: true, nullable: true })
  vendor?: Ref<Member>;

}

describe('GH issue 2379', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Order, Job, VendorBuyerRelationship, Member],
      dbName: ':memory:',
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
