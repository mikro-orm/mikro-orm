import { DecimalType, DoubleType, MikroORM } from '@mikro-orm/sqlite';

import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
@Entity()
class Amount {

  @PrimaryKey()
  id!: number;

  @Property({ type: DecimalType, precision: 5, scale: 2 })
  amount1!: string;

  @Property({ type: DoubleType })
  amount2!: string;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: ':memory:',
    entities: [Amount],
  });
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

test('decimal returned as number', async () => {
  orm.em.create(Amount, { amount1: '12.3', amount2: '12.3' });
  await orm.em.flush();
  orm.em.clear();

  const { amount1, amount2 } = await orm.em.findOneOrFail(Amount, { amount1: '12.3', amount2: '12.3' });
  expect(amount1).toBe('12.3');
  expect(amount2).toBe('12.3');
});
