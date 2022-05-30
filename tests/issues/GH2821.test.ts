import { Entity, MikroORM, OneToOne, PrimaryKey } from '@mikro-orm/core';
import type { SqliteDriver } from '@mikro-orm/sqlite';

@Entity()
export class Position {

  @PrimaryKey()
  id!: number;

  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  @OneToOne(() => Leg, (leg: Leg) => leg.purchasePosition, { owner: true, nullable: true })
  purchase?: any;

  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  @OneToOne(() => Leg, (leg: Leg) => leg.salePosition, { owner: true, nullable: true })
  sale?: any;

}

@Entity()
export class Leg {

  @PrimaryKey()
  id!: number;

  @OneToOne(() => Position, (position: Position) => position.purchase, { nullable: true })
  purchasePosition?: Position;

  @OneToOne(() => Position, (position: Position) => position.sale, { nullable: true })
  salePosition?: Position;

}

describe('GH issue 2821', () => {

  let orm: MikroORM<SqliteDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      type: 'sqlite',
      dbName: ':memory:',
      entities: [Position, Leg],
    });
    await orm.getSchemaGenerator().refreshDatabase();
  });

  beforeEach(async () => {
    await orm.getSchemaGenerator().clearDatabase();
  });

  afterAll(async () => {
    await orm.close(true);
  });

  test(`should populate multiple 1-1 relations regardless of populate order`, async () => {
    const p = orm.em.create(Leg, {});
    const s = orm.em.create(Leg, {});
    const pos = orm.em.create(Position, { purchase: p, sale: s });
    await orm.em.fork().persistAndFlush(pos);

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
