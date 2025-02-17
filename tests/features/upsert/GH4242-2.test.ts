import { Entity, ManyToOne, PrimaryKey, Property, Ref, Reference, SimpleLogger, sql, Unique } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/mysql';
import { mockLogger } from '../../helpers.js';

@Entity()
class B {

  @PrimaryKey()
  id!: number;

  @ManyToOne(() => D, { deleteRule: 'cascade', ref: true })
  d!: Ref<D>;

  @Property({ unique: true })
  order!: number;

  @Property({ default: sql.now(), onUpdate: () => new Date() })
  updatedAt: Date = new Date();

}

@Entity()
@Unique({ properties: ['tenantWorkflowId'] })
class D {

  @PrimaryKey()
  id!: number;

  @Property()
  tenantWorkflowId!: number;

  @Property({ default: sql.now(), onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  @Property({ nullable: true })
  optional?: string;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [B, D],
    dbName: `gh-4242`,
    port: 3308,
    strict: true,
    loggerFactory: SimpleLogger.create,
  });

  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

beforeEach(async () => {
  await orm.schema.clearDatabase();
});

test('4242 1/4', async () => {
  const mock = mockLogger(orm);

  const loadedDs = await orm.em.fork().upsertMany(D, [
    { tenantWorkflowId: 1, optional: 'foo' },
  ]);
  expect(loadedDs).toEqual([{
    id: expect.any(Number),
    optional: 'foo',
    updatedAt: expect.any(Date),
    tenantWorkflowId: 1,
  }]);
  expect(mock.mock.calls).toEqual([
    ["[query] insert into `d` (`tenant_workflow_id`, `optional`) values (1, 'foo') on duplicate key update `optional` = values(`optional`)"],
    ['[query] select `d0`.`id`, `d0`.`updated_at`, `d0`.`tenant_workflow_id` from `d` as `d0` where `d0`.`tenant_workflow_id` = 1'],
  ]);
  mock.mockReset();

  const loadedDs2 = await orm.em.fork().upsertMany(D, [
    { tenantWorkflowId: 1 },
  ]);
  expect(loadedDs2).toEqual([{
    id: expect.any(Number),
    optional: 'foo',
    updatedAt: expect.any(Date),
    tenantWorkflowId: 1,
  }]);
  expect(mock.mock.calls).toEqual([
    ['[query] insert ignore into `d` (`tenant_workflow_id`) values (1)'],
    ['[query] select `d0`.`id`, `d0`.`updated_at`, `d0`.`optional`, `d0`.`tenant_workflow_id` from `d` as `d0` where `d0`.`tenant_workflow_id` = 1'],
  ]);
  mock.mockReset();

  const date = '2023-05-21 14:39:17.825';
  const loadedDs3 = await orm.em.fork().upsertMany(D, [
    { tenantWorkflowId: 1, updatedAt: date },
  ]);
  expect(loadedDs3).toEqual([{
    id: expect.any(Number),
    optional: 'foo',
    updatedAt: expect.any(Date),
    tenantWorkflowId: 1,
  }]);
  expect(mock.mock.calls).toEqual([
    [`[query] insert into \`d\` (\`tenant_workflow_id\`, \`updated_at\`) values (1, '${date}') on duplicate key update \`updated_at\` = values(\`updated_at\`)`],
    ['[query] select `d0`.`id`, `d0`.`optional`, `d0`.`tenant_workflow_id` from `d` as `d0` where `d0`.`tenant_workflow_id` = 1'],
  ]);
  mock.mockReset();
});

test('4242 2/4', async () => {
  const loadedDs4 = await orm.em.upsertMany(D, [
    { tenantWorkflowId: 1 },
  ]);
  expect(loadedDs4).toEqual([{
    id: expect.any(Number),
    updatedAt: expect.any(Date),
    tenantWorkflowId: 1,
    optional: null,
  }]);
  await orm.em.flush();

  const b = await orm.em.upsert(B, {
    d: loadedDs4[0],
    order: 0,
    updatedAt: new Date(),
  });
  await orm.em.flush();
  expect(b).toEqual({
    id: expect.any(Number),
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
    id: expect.any(Number),
    optional: 'foo',
    updatedAt: expect.any(Date),
    tenantWorkflowId: 1,
  });
  expect(mock.mock.calls).toEqual([
    ["[query] insert into `d` (`tenant_workflow_id`, `optional`) values (1, 'foo') on duplicate key update `optional` = values(`optional`)"],
    ['[query] select `d0`.`id`, `d0`.`updated_at` from `d` as `d0` where `d0`.`tenant_workflow_id` = 1 limit 1'],
  ]);
  mock.mockReset();

  const loadedDs2 = await orm.em.fork().upsert(D, { tenantWorkflowId: 1 });
  expect(loadedDs2).toEqual({
    id: expect.any(Number),
    optional: 'foo',
    updatedAt: expect.any(Date),
    tenantWorkflowId: 1,
  });
  expect(mock.mock.calls).toEqual([
    ['[query] insert ignore into `d` (`tenant_workflow_id`) values (1)'],
    ['[query] select `d0`.`id`, `d0`.`updated_at`, `d0`.`optional` from `d` as `d0` where `d0`.`tenant_workflow_id` = 1 limit 1'],
  ]);
  mock.mockReset();

  const date = '2023-05-21 15:34:17.504';
  const loadedDs3 = await orm.em.fork().upsert(D, { tenantWorkflowId: 1, updatedAt: date });
  expect(loadedDs3).toEqual({
    id: expect.any(Number),
    optional: 'foo',
    updatedAt: expect.any(Date),
    tenantWorkflowId: 1,
  });
  expect(mock.mock.calls).toEqual([
    [`[query] insert into \`d\` (\`tenant_workflow_id\`, \`updated_at\`) values (1, '${date}') on duplicate key update \`updated_at\` = values(\`updated_at\`)`],
    ['[query] select `d0`.`id`, `d0`.`optional` from `d` as `d0` where `d0`.`tenant_workflow_id` = 1 limit 1'],
  ]);
  mock.mockReset();
});

test('4242 4/4', async () => {
  const loadedDs4 = await orm.em.upsert(D, { tenantWorkflowId: 1 });
  expect(loadedDs4).toEqual({
    id: expect.any(Number),
    optional: null,
    updatedAt: expect.any(Date),
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
    id: expect.any(Number),
    d: expect.any(Reference),
    updatedAt: expect.any(Date),
    order: 0,
  });
  expect(b.d.isInitialized()).toBe(true);
});
