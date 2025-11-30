import { MikroORM } from '@mikro-orm/sqlite';
import { Entity, OneToOne, PrimaryKey, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
class Position {

  @PrimaryKey()
  id!: number;

  @OneToOne(() => Leg, (leg: Leg) => leg.purchasePosition, { owner: true, nullable: true })
  purchase?: any;

  @OneToOne(() => Leg, (leg: Leg) => leg.salePosition, { owner: true, nullable: true })
  sale?: any;

}

@Entity()
class Leg {

  @PrimaryKey()
  id!: number;

  @OneToOne(() => Position, (position: Position) => position.purchase, { nullable: true })
  purchasePosition?: Position;

  @OneToOne(() => Position, (position: Position) => position.sale, { nullable: true })
  salePosition?: Position;

}

describe('GH issue 2821', () => {

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      dbName: ':memory:',
      entities: [Position, Leg],
    });
    await orm.schema.refresh();
  });

  beforeEach(async () => {
    await orm.schema.clear();
  });

  afterAll(async () => {
    await orm.close(true);
  });

  test(`should populate multiple 1-1 relations regardless of populate order`, async () => {
    const p = orm.em.create(Leg, {});
    const s = orm.em.create(Leg, {});
    const pos = orm.em.create(Position, { purchase: p, sale: s });
    await orm.em.fork().persist(pos).flush();

    const leg0 = await orm.em.fork().findOneOrFail(Leg, p.id);
    expect(leg0.salePosition).toBeFalsy();
    expect(leg0.purchasePosition).toBeTruthy();

    const leg1 = await orm.em.fork().findOneOrFail(Leg, p.id, { populate: ['purchasePosition', 'salePosition'] });
    expect(leg1.salePosition).toBeFalsy();
    expect(leg1.purchasePosition).toBeTruthy();

    const leg2 = await orm.em.fork().findOneOrFail(Leg, p.id, { populate: ['salePosition', 'purchasePosition'] });
    expect(leg2.salePosition).toBeFalsy();
    expect(leg2.purchasePosition).toBeTruthy();
  });

});
