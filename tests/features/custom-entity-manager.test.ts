import { MikroORM, SqlEntityManager, SqliteDriver } from '@mikro-orm/sqlite';
import { Entity, PrimaryKey, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
class Author {
  @PrimaryKey()
  id!: number;
}

class MyEntityManager extends SqlEntityManager<SqliteDriver> {
  myCustomMethod(base: number): number {
    return base * Math.random();
  }
}

test('using custom EM class', async () => {
  const orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [Author],
    dbName: ':memory:',
    entityManager: MyEntityManager,
  });
  await orm.schema.create();
  expect(orm.em).toBeInstanceOf(MyEntityManager);
  const fork = orm.em.fork();
  expect(fork).toBeInstanceOf(MyEntityManager);
  orm.em = fork; // just to test assignability
  const res = orm.em.myCustomMethod(123);
  expect(typeof res).toBe('number');
  await orm.close();
});
