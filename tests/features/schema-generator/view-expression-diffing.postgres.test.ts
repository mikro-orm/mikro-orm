import { defineEntity, p, MikroORM } from '@mikro-orm/postgresql';

const Donation = defineEntity({
  name: 'Donation',
  tableName: 'donation',
  properties: {
    id: p.integer().primary(),
    createdAt: p.datetime(),
  },
});

const Candidate = defineEntity({
  name: 'Candidate',
  tableName: 'candidate',
  properties: {
    id: p.string().primary(),
    importYear: p.integer(),
    principalCommitteeId: p.string().nullable(),
  },
});

// PostgreSQL names the output column of a bare function call after the function itself,
// so `max(created_at)` is stored back as `max(created_at) AS max`. `min` additionally
// collides with the `in (...)` normalization rule.
const ImportStats = defineEntity({
  name: 'ImportStats',
  tableName: 'import_stats_view',
  view: true,
  expression: `select 1 as id, (select max(created_at) from donation) as last_import_at, (select min(import_year) from candidate) as earliest_import_year`,
  properties: {
    id: p.integer().primary(),
    lastImportAt: p.datetime().nullable(),
    earliestImportYear: p.integer().nullable(),
  },
});

// PostgreSQL adds a cast with a multi word type name here (`NULL::character varying`).
const CandidateCommittees = defineEntity({
  name: 'CandidateCommittees',
  tableName: 'candidate_committees_view',
  view: true,
  expression: `select id, array_remove(array_agg(distinct principal_committee_id), null) as principal_committee_ids from candidate group by id`,
  properties: {
    id: p.string().primary(),
    principalCommitteeIds: p.string().array(),
  },
});

describe('view expression diffing in postgres', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Donation, Candidate],
      dbName: 'mikro_orm_test_view_expr_diffing',
    });
    await orm.schema.refresh({ dropDb: true });
  });

  afterAll(async () => {
    await orm.schema.dropDatabase();
    await orm.close(true);
  });

  test('implicit aggregate alias and multi word casts do not cause drift', async () => {
    orm.discoverEntity([ImportStats, CandidateCommittees]);

    const diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).not.toBe('');
    await orm.schema.execute(diff);

    await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');
  });
});
