import { EntitySchema } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/sqlite';

const Kind = Object.freeze({ A: 'A', B: 'B', C: 'C' });

interface ITarget {
  id: number;
}

interface IThing {
  id: number;
  _kind: string | null;
  kind: ITarget | null;
}

const Target = new EntitySchema<ITarget>({
  name: 'GH7527Target',
  tableName: 'gh7527_target',
  properties: {
    id: { type: 'number', primary: true, autoincrement: true },
  },
});

// "safe rename" shape: legacy enum column `kind` kept as `_kind`
// via fieldName, new ManyToOne relation exposed as `kind`.
const Thing = new EntitySchema<IThing>({
  name: 'GH7527Thing',
  tableName: 'gh7527_thing',
  properties: {
    id: { type: 'number', primary: true, autoincrement: true },
    _kind: { enum: true, items: () => Kind, fieldName: 'kind', nullable: true },
    kind: { kind: 'm:1', entity: () => Target, nullable: true },
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Thing, Target],
    dbName: ':memory:',
  });
  await orm.schema.refresh();
});

afterAll(async () => {
  await orm.close(true);
});

test('GH #7527: QB does not double-map rows when fieldName collides with another property name', async () => {
  await orm.em.getConnection().execute(`insert into gh7527_target (id) values (1)`);
  await orm.em.getConnection().execute(`insert into gh7527_thing (id, kind, kind_id) values (1, 'A', 1)`);

  const em = orm.em.fork();
  const results = await em.createQueryBuilder(Thing).select('*').getResultList();

  expect(results).toHaveLength(1);
  const thing = results[0];
  expect(thing._kind).toBe('A');
  expect(thing.kind).toBeDefined();
});
