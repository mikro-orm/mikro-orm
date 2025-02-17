import { Entity, ManyToOne, PrimaryKey, Property, Ref, Reference, SimpleLogger, sql, Unique } from '@mikro-orm/core';
import { MikroORM, PostgreSqlPlatform } from '@mikro-orm/postgresql';
import { mockLogger } from '../../helpers.js';

@Entity()
class B {

  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id!: string;

  @ManyToOne(() => D, { deleteRule: 'cascade', ref: true })
  d!: Ref<D>;

  @Property({ unique: true })
  order!: number;

  @Property({ length: 6, default: sql.now(), onUpdate: () => new Date() })
  updatedAt: Date = new Date();

}

@Entity()
@Unique({ properties: ['tenantWorkflowId'] })
class D {

  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id!: string;

  @Property()
  tenantWorkflowId!: number;

  @Property({ length: 6, default: sql.now(), onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  @Property({ nullable: true })
  optional?: string;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [B, D],
    dbName: `gh-4242`,
    loggerFactory: SimpleLogger.create,
  });

  await orm.schema.ensureDatabase();
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

beforeEach(async () => {
  await orm.schema.clearDatabase();
});

function formatDate(date: Date) {
  return (orm.em.getPlatform() as PostgreSqlPlatform).formatDate(date);
}

test('4242 1/4', async () => {
  const mock = mockLogger(orm);

  const loadedDs = await orm.em.fork().upsertMany(D, [
    { tenantWorkflowId: 1, optional: 'foo' },
  ]);
  expect(loadedDs).toEqual([{
    id: expect.any(String),
    optional: 'foo',
    updatedAt: expect.any(Date),
    tenantWorkflowId: 1,
  }]);
  expect(mock.mock.calls).toEqual([
    [`[query] insert into "d" ("tenant_workflow_id", "optional") values (1, 'foo') on conflict ("tenant_workflow_id") do update set "optional" = excluded."optional" returning "id", "updated_at"`],
  ]);
  mock.mockReset();

  const loadedDs2 = await orm.em.fork().upsertMany(D, [
    { tenantWorkflowId: 1 },
  ]);
  expect(loadedDs2).toEqual([{
    id: expect.any(String),
    optional: 'foo',
    updatedAt: expect.any(Date),
    tenantWorkflowId: 1,
  }]);
  expect(mock.mock.calls).toEqual([
    ['[query] insert into "d" ("tenant_workflow_id") values (1) on conflict ("tenant_workflow_id") do nothing returning "id", "updated_at", "optional"'],
    ['[query] select "d0"."id", "d0"."updated_at", "d0"."optional", "d0"."tenant_workflow_id" from "d" as "d0" where "d0"."tenant_workflow_id" = 1'],
  ]);
  mock.mockReset();

  const date = new Date();
  const loadedDs3 = await orm.em.fork().upsertMany(D, [
    { tenantWorkflowId: 1, updatedAt: date },
  ]);
  expect(loadedDs3).toEqual([{
    id: expect.any(String),
    optional: 'foo',
    updatedAt: expect.any(Date),
    tenantWorkflowId: 1,
  }]);
  expect(mock.mock.calls).toEqual([
    [`[query] insert into "d" ("tenant_workflow_id", "updated_at") values (1, '${formatDate(date)}') on conflict ("tenant_workflow_id") do update set "updated_at" = excluded."updated_at" returning "id", "optional"`],
  ]);
  mock.mockReset();
});

test('4242 2/4', async () => {
  const loadedDs4 = await orm.em.upsertMany(D, [
    { tenantWorkflowId: 1 },
  ]);
  expect(loadedDs4).toEqual([{
    id: expect.any(String),
    updatedAt: expect.any(Date),
    optional: null,
    tenantWorkflowId: 1,
  }]);
  await orm.em.flush();

  const b = await orm.em.upsert(B, {
    d: loadedDs4[0],
    order: 0,
    updatedAt: new Date(),
  });
  await orm.em.flush();
  expect(b).toEqual({
    id: expect.any(String),
    d: expect.any(Reference),
    updatedAt: expect.any(Date),
    order: 0,
  });
  expect(b.d.isInitialized()).toBe(true);
});

test('4242 3/4', async () => {
  const mock = mockLogger(orm);

  const loadedDs = await orm.em.fork().upsert(D, { tenantWorkflowId: 1, optional: 'foo' });
  expect(loadedDs).toEqual({
    id: expect.any(String),
    optional: 'foo',
    updatedAt: expect.any(Date),
    tenantWorkflowId: 1,
  });
  expect(mock.mock.calls).toEqual([
    [`[query] insert into "d" ("tenant_workflow_id", "optional") values (1, 'foo') on conflict ("tenant_workflow_id") do update set "optional" = excluded."optional" returning "id", "updated_at"`],
  ]);
  mock.mockReset();

  const loadedDs2 = await orm.em.fork().upsert(D, { tenantWorkflowId: 1 });
  expect(loadedDs2).toEqual({
    id: expect.any(String),
    optional: 'foo',
    updatedAt: expect.any(Date),
    tenantWorkflowId: 1,
  });
  expect(mock.mock.calls).toEqual([
    ['[query] insert into "d" ("tenant_workflow_id") values (1) on conflict ("tenant_workflow_id") do nothing returning "id", "updated_at", "optional"'],
    ['[query] select "d0"."id", "d0"."updated_at", "d0"."optional" from "d" as "d0" where "d0"."tenant_workflow_id" = 1 limit 1'],
  ]);
  mock.mockReset();

  const date = new Date();
  const loadedDs3 = await orm.em.fork().upsert(D, { tenantWorkflowId: 1, updatedAt: date });
  expect(loadedDs3).toEqual({
    id: expect.any(String),
    optional: 'foo',
    updatedAt: expect.any(Date),
    tenantWorkflowId: 1,
  });
  expect(mock.mock.calls).toEqual([
    [`[query] insert into "d" ("tenant_workflow_id", "updated_at") values (1, '${formatDate(date)}') on conflict ("tenant_workflow_id") do update set "updated_at" = excluded."updated_at" returning "id", "optional"`],
  ]);
  mock.mockReset();
});

test('4242 4/4', async () => {
  const loadedDs4 = await orm.em.upsert(D, { tenantWorkflowId: 1 });
  expect(loadedDs4).toEqual({
    id: expect.any(String),
    updatedAt: expect.any(Date),
    optional: null,
    tenantWorkflowId: 1,
  });
  await orm.em.flush();

  const b = await orm.em.upsert(B, {
    d: loadedDs4,
    order: 0,
    updatedAt: new Date(),
  });
  await orm.em.flush();
  expect(b).toEqual({
    id: expect.any(String),
    d: expect.any(Reference),
    updatedAt: expect.any(Date),
    order: 0,
  });
  expect(b.d.isInitialized()).toBe(true);
});
