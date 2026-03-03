import { MikroORM, defineEntity, p } from '@mikro-orm/sqlite';

const RadioOption = defineEntity({
  name: 'RadioOption',
  properties: {
    id: p.integer().primary(),
    enabled: p.boolean(),
    createdAt: p.datetime().onCreate(() => new Date()),
    radio: () => p.oneToOne(Radio).mappedBy('option').ref(),
  },
});

const Radio = defineEntity({
  name: 'Radio',
  properties: {
    id: p.integer().primary(),
    question: p.string().onCreate(() =>
      Math.random()
        .toString(36)
        .replace(/[^a-z]+/g, '')
        .substring(0, 10),
    ),
    option: () => p.oneToOne(RadioOption).ref().eager(),
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [Radio, RadioOption],
  });
  await orm.schema.create();
});

afterAll(async () => {
  await orm.close(true);
});

test('em.create property calls constructors of nested entities with Reference wrapper', async () => {
  const radio = orm.em.create(Radio, {
    question: 'bla bla',
    option: {
      enabled: false,
    },
  });
  expect(radio.option.getEntity().createdAt).toBeDefined();
  await orm.em.persist(radio).flush();
});
