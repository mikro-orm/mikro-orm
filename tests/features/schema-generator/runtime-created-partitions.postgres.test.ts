import { EntitySchema, MikroORM } from '@mikro-orm/postgresql';

class Parent {
  id!: string;
  postedAt!: Date;
}

const ParentSchema = new EntitySchema({
  class: Parent,
  tableName: 'parent',
  partitionBy: {
    type: 'range',
    expression: 'postedAt',
    partitions: [{ name: 'parent_default', values: 'default' }],
  },
  properties: {
    id: { type: 'uuid', primary: true },
    postedAt: { type: 'Date', primary: true },
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [ParentSchema],
    dbName: 'mikro_orm_test_runtime_partitions',
  });
  await orm.schema.refresh();
});

afterAll(() => orm.close(true));

test('partitions created outside of metadata do not trigger a table rebuild', async () => {
  await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');

  await orm.em.execute(`create table parent_gy1 partition of parent for values from ('2026-01-01') to ('2026-02-01')`);
  await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');
  await expect(orm.schema.getUpdateSchemaMigrationSQL({ wrap: false })).resolves.toEqual({ up: '', down: '' });
});
