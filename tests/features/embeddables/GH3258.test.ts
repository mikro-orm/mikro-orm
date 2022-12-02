import { Embeddable, Embedded, Entity, PrimaryKey, Property } from '@mikro-orm/core';
import { ObjectId } from 'bson';
import { MikroORM } from '@mikro-orm/mongodb';

@Embeddable()
export class TradeVessel {

  @Property()
  imo: string;

  constructor(imo: string) {
    this.imo = imo;
  }

}

@Entity()
export class Trade {

  @PrimaryKey()
  _id!: ObjectId;

  @Embedded(() => TradeVessel, { object: true, nullable: true })
  vessel: TradeVessel | null = null;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Trade],
    dbName: 'mikro_orm_test_3258',
  });
  await orm.schema.refreshDatabase();
});

afterAll(() => orm.close(true));

beforeEach(() => orm.em.nativeDelete(Trade, {}));

test('hydration of null value in embeddable property (GH #3258)', async () => {
  await orm.em.getDriver().nativeInsertMany('Trade', [
    { vessel: { imo: '123' } },
    { vessel: null },
  ]);

  const t = await orm.em.find(Trade, {});
  expect(t[0].vessel?.imo).toBe('123');
  expect(t[1].vessel).toBeNull();
});

test('persisting of null value in embeddable property (GH #3258)', async () => {
  const t1 = new Trade();
  t1.vessel = new TradeVessel('123');
  const t2 = new Trade();
  await orm.em.fork().persistAndFlush([t1, t2]);

  const t = await orm.em.find(Trade, {});
  expect(t[0].vessel?.imo).toBe('123');
  expect(t[1].vessel).toBeNull();
});
