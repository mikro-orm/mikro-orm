import { defineEntity, p, MikroORM } from '@mikro-orm/sqlite';
import { mockLogger } from '../helpers.js';

const EmbeddableSchema = defineEntity({
  name: 'Embeddable',
  embeddable: true,
  properties: {
    someProperty: p.integer(),
  },
});
class Embeddable extends EmbeddableSchema.class {}
EmbeddableSchema.setClass(Embeddable);

const EntitySchema = defineEntity({
  name: 'Entity',
  properties: {
    id: p.integer().primary(),
    embeddable: () => p.embedded(Embeddable).object(),
  },
});
class Entity extends EntitySchema.class {}
EntitySchema.setClass(Entity);

// loading an entity whose object embeddable column holds a key not declared in the
// embeddable schema must not be treated as a change and trigger a spurious update on flush
test('GH #7821: object embeddable with extra JSON key does not trigger update on flush', async () => {
  const orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [Embeddable, Entity],
  });
  await orm.schema.refresh();

  await orm.em.insert(Entity, { id: 1, embeddable: { someProperty: 1, unexpected: null } } as any);

  const em = orm.em.fork();
  await em.findOneOrFail(Entity, { id: 1 });

  const mock = mockLogger(orm, ['query']);
  await em.flush();

  const updates = mock.mock.calls.flat().filter((q: string) => /update/i.test(q));
  expect(updates).toHaveLength(0);

  await orm.close();
});
