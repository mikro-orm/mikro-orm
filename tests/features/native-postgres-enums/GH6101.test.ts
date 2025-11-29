import { EntitySchema, MikroORM } from '@mikro-orm/postgresql';
import { ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { v4 as uuidv4 } from 'uuid';

const A1Schema = new EntitySchema({
  name: 'A',
  schema: 'one_schema',
  properties: {
    id: { type: 'uuid', primary: true, onCreate: () => uuidv4() },
    enum1: { items: ['A', 'B', 'C'], nativeEnumName: 'SomeEnum', nullable: true, type: 'enum' },
  },
});

const A2Schema = new EntitySchema({
  name: 'A',
  schema: 'one_schema',
  properties: {
    id: { type: 'uuid', primary: true, onCreate: () => uuidv4() },
    enum1: { items: ['A', 'B', 'C', 'D'], nativeEnumName: 'SomeEnum', nullable: true, type: 'enum' },
  },
});

const B1Schema = new EntitySchema({
  name: 'B',
  schema: 'one_schema',
  properties: {
    id: { type: 'uuid', primary: true, onCreate: () => uuidv4() },
    enum1: { items: ['A', 'B', 'C'], nativeEnumName: 'one_schema.SomeEnum', nullable: true, type: 'enum' },
  },
});

const B2Schema = new EntitySchema({
  name: 'B',
  schema: 'one_schema',
  properties: {
    id: { type: 'uuid', primary: true, onCreate: () => uuidv4() },
    enum1: { items: ['A', 'B', 'C', 'D'], nativeEnumName: 'one_schema.SomeEnum', nullable: true, type: 'enum' },
  },
});

const C1Schema = new EntitySchema({
  name: 'C',
  schema: 'one_schema',
  properties: {
    id: { type: 'uuid', primary: true, onCreate: () => uuidv4() },
    enum1: { items: ['A', 'B', 'C'], nativeEnumName: 'two_schema.SomeEnum', nullable: true, type: 'enum' },
  },
});

const C2Schema = new EntitySchema({
  name: 'C',
  schema: 'one_schema',
  properties: {
    id: { type: 'uuid', primary: true, onCreate: () => uuidv4() },
    enum1: { items: ['A', 'B', 'C', 'D'], nativeEnumName: 'two_schema.SomeEnum', nullable: true, type: 'enum' },
  },
});

test('6100 1/3', async () => {
  const orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: '6101-1',
    entities: [A1Schema],
  });
  await orm.schema.refreshDatabase();

  orm.discoverEntity(A2Schema, 'A');
  await orm.schema.updateSchema();

  orm.em.create(A2Schema, { enum1: 'D' });
  await orm.em.flush();
  orm.em.clear();
  await orm.close(true);
});

test('6100 2/3', async () => {
  const orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: '6101-2',
    entities: [B1Schema],
  });
  await orm.schema.refreshDatabase();

  orm.discoverEntity(B2Schema, 'B');
  await orm.schema.updateSchema();

  orm.em.create(B2Schema, { enum1: 'D' });
  await orm.em.flush();
  orm.em.clear();
  await orm.close(true);
});

test('6100 3/3', async () => {
  const orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: '6101-3',
    entities: [C1Schema],
  });
  await orm.schema.refreshDatabase();

  orm.discoverEntity(C2Schema, 'C');
  await orm.schema.updateSchema();

  orm.em.create(C2Schema, { enum1: 'D' });
  await orm.em.flush();
  orm.em.clear();
  await orm.close(true);
});
