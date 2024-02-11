import { Entity, PrimaryKey, Property, JsonType } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/sqlite';

@Entity()
class A {

  @PrimaryKey()
  id!: number;

  @Property({ type: JsonType })
  array!: B[];

}

interface B {
  test: string;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [A],
    dbName: ':memory:',
  });
  await orm.schema.createSchema();
});

afterAll(() => orm.close());

test('GH #5123', async () => {
  const a = orm.em.create(A, { array: [{ test: 'test' }] });
  await orm.em.persistAndFlush(a);

  const a1 = await orm.em.fork().findOneOrFail(A, 1);
  const a2 = await orm.em.fork().findOneOrFail(A, 1, { fields: ['array'] });

  expect(a1.array.filter(i => i)).toEqual([{ test: 'test' }]);
  expect(a2.array.filter(i => i)).toEqual([{ test: 'test' }]);
});
