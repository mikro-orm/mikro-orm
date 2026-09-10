import { MikroORM, Ref } from '@mikro-orm/sqlite';
import { Entity, OneToOne, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';

@Entity()
class Child {
  @PrimaryKey({ type: 'number' })
  id!: number;

  @Property({ type: 'string' })
  name!: string;

  @Property({ type: 'json' })
  payload!: Record<string, unknown>;
}

@Entity()
class Parent {
  @PrimaryKey({ type: 'number' })
  id!: number;

  @Property({ type: 'string' })
  name!: string;

  @OneToOne(() => Child, { ref: true })
  child!: Ref<Child>;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Parent, Child],
    dbName: ':memory:',
  });
  await orm.schema.create();
});

afterAll(() => orm.close(true));

test('result cache hit does not mark populated relations dirty', async () => {
  const em0 = orm.em.fork();
  const child = em0.create(Child, { id: 1, name: 'child', payload: { a: 1, b: { c: 2 } } });
  em0.create(Parent, { id: 1, name: 'parent', child });
  await em0.flush();

  const emA = orm.em.fork();
  await emA.findOne(Parent, 1, { populate: ['child'], cache: 1000 });

  const emB = orm.em.fork();
  await emB.findOne(Parent, 1, { populate: ['child'], cache: 1000 });

  emB.getUnitOfWork().computeChangeSets();
  expect(emB.getUnitOfWork().getChangeSets()).toHaveLength(0);
});
