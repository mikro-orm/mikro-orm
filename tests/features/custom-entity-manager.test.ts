import { Entity, PrimaryKey } from '@mikro-orm/core';
import { MikroORM, SqlEntityManager } from '@mikro-orm/sqlite';

@Entity()
class Author {

  @PrimaryKey()
  id!: number;

}

class MyEntityManager extends SqlEntityManager {

  myCustomMethod(base: number): number {
    return base * Math.random();
  }

}

test('using custom EM class', async () => {
  const orm = await MikroORM.init({
    entities: [Author],
    dbName: ':memory:',
    entityManager: MyEntityManager,
  });
  await orm.schema.createSchema();
  expect(orm.em).toBeInstanceOf(MyEntityManager);
  const res = orm.em.myCustomMethod(123);
  expect(typeof res).toBe('number');
  await orm.close();
});
