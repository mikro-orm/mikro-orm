import { EntityManager, MikroORM } from '@mikro-orm/sqlite';
import { CreateRequestContext, Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
class A {

  @PrimaryKey()
  id!: number;

  @Property()
  prop!: string;

}

class Foo {

  constructor(private em: EntityManager) {}

  @CreateRequestContext()
  async bar() {
    return this.em.id;
  }

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [A],
    dbName: ':memory:',
  });
  await orm.schema.createSchema();
});

afterAll(() => orm.close(true));

test('@CreateRequestContext() and explicit transactions', async () => {
  const foo = new Foo(orm.em);
  const globalId = orm.em.id;

  const [innerId, ...decoratedIds] = await orm.em.transactional(async () => {
    const id1 = await foo.bar();
    const id2 = await foo.bar();
    const id3 = await foo.bar();
    return [orm.em.id, id1, id2, id3];
  });

  expect(globalId).not.toBe(innerId);
  expect(globalId).not.toBe(decoratedIds[0]);
  expect(innerId).not.toBe(decoratedIds[0]);
  expect(new Set(decoratedIds).size).toBe(3);
});
