import { Entity, PrimaryKey, Property } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/sqlite';

@Entity()
class Test {

  @PrimaryKey()
  id!: number;

  @Property()
  value!: number;

  @Property({ persist: true, hydrate: false })
  get doubleValue(): number {
    return this.value * 2;
  }

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Test],
    dbName: ':memory:',
  });
  await orm.schema.createSchema();
});

afterAll(() => orm.close(true));

test('3936', async () => {
  const test = new Test();
  test.value = 5;
  orm.em.persist(test);
  await orm.em.flush();

  expect(test.doubleValue).toBe(10);
  test.value = 7;
  expect(test.doubleValue).toBe(14);
  await orm.em.flush();
  await orm.em.refresh(test);
  expect(test.doubleValue).toBe(14);
  test.value = 70;
  expect(test.doubleValue).toBe(140);
});
