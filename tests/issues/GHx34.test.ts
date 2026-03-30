import { defineEntity, MikroORM, p } from '@mikro-orm/sqlite';

const ClientProductMarginSchema = defineEntity({
  embeddable: true,
  name: 'ClientProductMargin',
  properties: {
    singles: p
      .decimal('number')
      .formula(
        cols => `
                    CASE
                        WHEN ${cols}.price_net = 0 THEN 0
                        ELSE (
                            (
                                ${cols}.price_net - ${cols}.cost_price_singles
                            ) * 1.0 / ${cols}.price_net
                        ) * 100
                    END
                `,
      )
      .precision(10)
      .scale(3),
    packs: p
      .decimal('number')
      .formula(
        cols => `
                    CASE
                        WHEN ${cols}.price_net = 0 THEN 0
                        ELSE (
                            (
                                ${cols}.price_net - ${cols}.cost_price_packs
                            ) * 1.0 / ${cols}.price_net
                        ) * 100
                    END
                `,
      )
      .precision(10)
      .scale(3),
  },
});

export class ClientProductMargin extends ClientProductMarginSchema.class {}
ClientProductMarginSchema.setClass(ClientProductMargin);

const ClientProductSchema = defineEntity({
  name: 'ClientProduct',
  tableName: 'ClientProducts',
  properties: {
    id: p.integer().primary(),
    name: p.string().length(80).unique(),
    price_net: p.decimal('number').precision(10).scale(2),
    cost_price_singles: p.decimal('number').precision(10).scale(2),
    cost_price_packs: p.decimal('number').precision(10).scale(2),
    margin: () => p.embedded(ClientProductMargin),
  },
});

export class ClientProduct extends ClientProductSchema.class {}
ClientProductSchema.setClass(ClientProduct);

describe('GHx34', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      dbName: ':memory:',
      entities: [ClientProduct],
      serialization: { forceObject: true },
    });
    await orm.schema.refresh();
  });

  afterAll(() => orm.close(true));

  it('should not need formula on create', async () => {
    const cpNew = orm.em.create(ClientProduct, {
      name: 'Test Product',
      price_net: 10,
      cost_price_packs: 7,
      cost_price_singles: 14,
    });

    await orm.em.flush();
    orm.em.clear();

    expect(cpNew.id).toBeDefined();

    const loaded = await orm.em.findOneOrFail(ClientProduct, cpNew.id);
    expect(loaded).toMatchObject({
      name: 'Test Product',
      price_net: 10,
      cost_price_packs: 7,
      cost_price_singles: 14,
    });
    expect(loaded.margin.singles).toBeCloseTo(-40);
    expect(loaded.margin.packs).toBeCloseTo(30);
  });
});
