import { EntitySchema, MikroORM } from '@mikro-orm/pglite';

const ParentV1 = new EntitySchema({
  name: 'Parent',
  tableName: 'parent',
  properties: {
    id: { type: 'uuid', primary: true },
  },
});

interface PartitionedParent {
  id: string;
  createdAtKey: Date;
}

const ParentV2 = new EntitySchema<PartitionedParent>({
  name: 'Parent',
  tableName: 'parent',
  partitionBy: {
    type: 'range',
    expression: 'createdAtKey',
    partitions: [{ name: 'parent_default', values: 'default' }],
  },
  properties: {
    id: { type: 'uuid', primary: true },
    createdAtKey: { type: 'Date', primary: true },
  },
});

const HashPartitionedParent = new EntitySchema({
  name: 'Parent',
  tableName: 'parent',
  partitionBy: { type: 'hash', expression: 'id', partitions: 2 },
  properties: {
    id: { type: 'uuid', primary: true },
  },
});

const createChild = (Parent: EntitySchema<any>, deleteRule?: 'cascade') =>
  new EntitySchema({
    name: 'Child',
    tableName: 'child',
    properties: {
      id: { type: 'number', primary: true },
      parent: { kind: 'm:1', entity: () => Parent, deleteRule },
    },
  });

async function migrate(from: EntitySchema<any>[], to: EntitySchema<any>[]) {
  const orm1 = await MikroORM.init({ entities: from, dbName: 'memory://' });
  const createSQL = await orm1.schema.getCreateSchemaSQL({ wrap: false });
  await orm1.close();

  const orm = await MikroORM.init({ entities: to, dbName: 'memory://' });
  await orm.schema.execute(createSQL);

  const diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
  expect(diff).toContain('set schema "mikro_orm_partition_swap"');
  await orm.schema.execute(diff);

  await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');
  await orm.close();
}

test('partitioning a referenced table whose PK becomes composite updates the inbound FK', async () => {
  await migrate([ParentV1, createChild(ParentV1)], [ParentV2, createChild(ParentV2)]);
});

test('partitioning a referenced table while the inbound FK changes in place', async () => {
  await migrate(
    [ParentV1, createChild(ParentV1)],
    [HashPartitionedParent, createChild(HashPartitionedParent, 'cascade')],
  );
});

test('partitioning a referenced table while the referencing table is dropped', async () => {
  await migrate([ParentV1, createChild(ParentV1)], [ParentV2]);
});
