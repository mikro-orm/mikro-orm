// GH #7717 - Polymorphic manyToOne targeting TPT sub-class entities resolves
// default filter conditions against the child sub-table alias instead of the
// parent table. Any filter column that lives only on the TPT parent table is
// emitted as `<child_alias>.<col>` which does not exist on the child sub-table.
import { defineEntity, MikroORM, p } from '@mikro-orm/sqlite';

const AuditEmbeddableSchema = defineEntity({
  name: 'AuditEmbeddable',
  embeddable: true,
  properties: {
    deletedAt: p.datetime().nullable(),
  },
});
class AuditEmbeddable extends AuditEmbeddableSchema.class {}
AuditEmbeddableSchema.setClass(AuditEmbeddable);

const DeviceSchema = defineEntity({
  name: 'Device',
  tableName: 'device',
  abstract: true,
  inheritance: 'tpt',
  filters: {
    excludeSoftDeleted: {
      name: 'excludeSoftDeleted',
      cond: { audit: { deletedAt: null } },
      default: true,
    },
  },
  properties: {
    id: p.integer().primary(),
    name: p.string(),
    audit: () => p.embedded(AuditEmbeddable).onCreate(() => new AuditEmbeddable()),
  },
});
class Device extends DeviceSchema.class {}
DeviceSchema.setClass(Device);

const DeviceASchema = defineEntity({
  name: 'DeviceA',
  tableName: 'device_a',
  extends: Device,
  properties: {
    id: p.integer().primary(),
    parts: () => p.oneToMany(Part).mappedBy('parentDevice'),
  },
});
class DeviceA extends DeviceASchema.class {}
DeviceASchema.setClass(DeviceA);

const DeviceBSchema = defineEntity({
  name: 'DeviceB',
  tableName: 'device_b',
  extends: Device,
  properties: { id: p.integer().primary() },
});
class DeviceB extends DeviceBSchema.class {}
DeviceBSchema.setClass(DeviceB);

const PartSchema = defineEntity({
  name: 'Part',
  tableName: 'part',
  properties: {
    id: p.integer().primary(),
    parentDevice: () => p.manyToOne([DeviceA, DeviceB]).ref(),
  },
});
class Part extends PartSchema.class {}
PartSchema.setClass(Part);

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [AuditEmbeddable, Device, DeviceA, DeviceB, Part],
    allowGlobalContext: true,
  });
  await orm.schema.refresh();
});

afterAll(async () => {
  await orm.close(true);
});

beforeEach(async () => {
  await orm.schema.clear();
  orm.em.clear();
});

test('populating inverse collection on polymorphic TPT target with parent-table default filter does not reference column on child sub-table', async () => {
  const deviceA = orm.em.create(DeviceA, { id: 1, name: 'A' });
  orm.em.create(Part, { id: 1, parentDevice: deviceA });
  await orm.em.flush();
  orm.em.clear();

  // Must not throw "no such column: <alias>.audit_deleted_at"
  const loaded = await orm.em.find(DeviceA, {}, { populate: ['parts'] });
  expect(loaded).toHaveLength(1);
  expect(loaded[0].parts).toHaveLength(1);
  expect(loaded[0].parts[0].id).toBe(1);
});

test('default filter on TPT parent excludes parts pointing to soft-deleted polymorphic targets', async () => {
  const deviceA1 = orm.em.create(DeviceA, { id: 1, name: 'A1' });
  const deviceA2 = orm.em.create(DeviceA, { id: 2, name: 'A2' });
  const deviceB1 = orm.em.create(DeviceB, { id: 3, name: 'B1' });
  orm.em.create(Part, { id: 1, parentDevice: deviceA1 });
  orm.em.create(Part, { id: 2, parentDevice: deviceA2 });
  orm.em.create(Part, { id: 3, parentDevice: deviceB1 });
  await orm.em.flush();

  // soft-delete A2 (parent-table column)
  deviceA2.audit.deletedAt = new Date();
  await orm.em.flush();
  orm.em.clear();

  // parts pointing to non-deleted targets remain; the part pointing to the soft-deleted
  // DeviceA2 must be excluded by the default filter
  const parts = await orm.em.find(Part, {}, { orderBy: { id: 'ASC' } });
  expect(parts.map(p => p.id)).toEqual([1, 3]);
});
