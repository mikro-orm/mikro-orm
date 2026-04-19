import { defineEntity, MikroORM, p } from '@mikro-orm/sqlite';

// GH #7500: enums merged with a namespace containing functions used to leak
// the function into `prop.items`, breaking schema generation.

// simulate the runtime shape of `enum Status {} namespace Status { export function f() {} }`
const Status = {
  0: 'Pending',
  1: 'Success',
  2: 'Error',
  3: 'Running',
  Pending: 0,
  Success: 1,
  Error: 2,
  Running: 3,
  isComplete(status: number) {
    return status === 1 || status === 2;
  },
};

const EntitySchema = defineEntity({
  name: 'GH7500_Entity',
  properties: {
    id: p.integer().primary().autoincrement(),
    status: p.enum(() => Status),
  },
});
class Entity extends EntitySchema.class {}
EntitySchema.setClass(Entity);

test('GH #7500: namespace-merged functions do not leak into enum items', async () => {
  const orm = await MikroORM.init({
    entities: [EntitySchema],
    dbName: ':memory:',
  });
  await orm.schema.create();

  const meta = orm.getMetadata(Entity);
  expect(meta.properties.status.items).toEqual([0, 1, 2, 3]);

  await orm.close(true);
});
