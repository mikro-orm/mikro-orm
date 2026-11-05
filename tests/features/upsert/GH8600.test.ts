import { defineEntity, MikroORM, p } from '@mikro-orm/sqlite';

// A grouped condition (`$or`, `$and`, `$not`) on the conflicting row was rendered as a column (`"job"."$or" = ...`).
const Job = defineEntity({
  name: 'Job',
  properties: {
    id: p.integer().primary().autoincrement(),
    key: p.string().unique(),
    status: p.string(),
    attempts: p.integer(),
    claimedAt: p.datetime(),
  },
});

const leaseExpired = new Date('2026-01-01T10:00:00.000Z');
const beforeLease = new Date('2026-01-01T09:00:00.000Z');
const afterLease = new Date('2026-01-01T11:00:00.000Z');

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({ entities: [Job], dbName: ':memory:' });
  await orm.schema.create();
});

beforeEach(async () => {
  await orm.schema.clear();
  await orm.em.insertMany(Job, [
    { key: 'failed', status: 'failed', attempts: 1, claimedAt: afterLease },
    { key: 'expired', status: 'running', attempts: 1, claimedAt: beforeLease },
    { key: 'running', status: 'running', attempts: 1, claimedAt: afterLease },
    { key: 'done', status: 'done', attempts: 1, claimedAt: beforeLease },
  ]);
});

afterAll(() => orm.close(true));

const claimable = {
  $or: [{ status: 'failed' }, { status: 'running', claimedAt: { $lt: leaseExpired } }],
};

async function claim(key: string) {
  await orm.em
    .fork()
    .upsert(
      Job,
      { key, status: 'running', attempts: 2, claimedAt: afterLease },
      { onConflictFields: ['key'], onConflictMergeFields: ['status', 'attempts'], onConflictWhere: claimable },
    );
  const job = await orm.em.fork().findOneOrFail(Job, { key });
  return [job.status, job.attempts];
}

test('qb renders an $or group on the conflicting row', () => {
  const sql = orm.em
    .createQueryBuilder(Job)
    .insert({ key: 'k', status: 'running', attempts: 1, claimedAt: afterLease })
    .onConflict('key')
    .merge(['status'])
    .where(claimable)
    .getQuery();

  expect(sql).toMatch(
    /do update set .* where \(`job`\.`status` = \? or \(`job`\.`status` = \? and `job`\.`claimed_at` < \?\)\)/,
  );
});

test('upsert with an $or onConflictWhere updates only the rows it matches', async () => {
  await expect(claim('failed')).resolves.toEqual(['running', 2]);
  await expect(claim('expired')).resolves.toEqual(['running', 2]);
  await expect(claim('running')).resolves.toEqual(['running', 1]);
  await expect(claim('done')).resolves.toEqual(['done', 1]);
});

test('upsert with $and and $not groups in onConflictWhere', async () => {
  const where = { $and: [{ attempts: 1 }, { $not: { status: 'done' } }] };
  await orm.em
    .fork()
    .upsert(
      Job,
      { key: 'done', status: 'running', attempts: 2, claimedAt: afterLease },
      { onConflictFields: ['key'], onConflictMergeFields: ['status', 'attempts'], onConflictWhere: where },
    );
  await orm.em
    .fork()
    .upsert(
      Job,
      { key: 'failed', status: 'running', attempts: 2, claimedAt: afterLease },
      { onConflictFields: ['key'], onConflictMergeFields: ['status', 'attempts'], onConflictWhere: where },
    );

  const jobs = await orm.em.fork().find(Job, { key: { $in: ['done', 'failed'] } }, { orderBy: { key: 'asc' } });
  expect(jobs.map(job => [job.key, job.status, job.attempts])).toEqual([
    ['done', 'done', 1],
    ['failed', 'running', 2],
  ]);
});
