import {
  DecimalType,
  Entity,
  MikroORM,
  PrimaryKey,
  Property,
} from '@mikro-orm/sqlite';

@Entity()
class Amount {

  @PrimaryKey()
  id!: number;

  @Property({ type: new DecimalType('string'), precision: 5, scale: 2 })
  amount!: string;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [Amount],
    debug: ['query', 'query-params'],
    allowGlobalContext: true, // only for testing
  });
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

test('decimal returned as number', async () => {
  orm.em.create(Amount, { amount: '12.3' });
  await orm.em.flush();
  orm.em.clear();

  const { amount } = await orm.em.findOneOrFail(Amount, { amount: '12.3' });
  expect(amount).toBe('12.3');
});
