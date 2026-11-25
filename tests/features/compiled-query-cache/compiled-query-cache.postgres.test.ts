import { defineEntity, MikroORM, p, QueryBuilder } from '@mikro-orm/postgresql';
import { mockLogger } from '../../helpers.js';

const Doc = defineEntity({
  name: 'CqcDoc',
  tableName: 'cqc_doc',
  schema: '*',
  properties: {
    id: p.integer().primary(),
    title: p.string(),
    kind: p.integer(),
  },
});

const Plain = defineEntity({
  name: 'CqcPlain',
  tableName: 'cqc_plain',
  properties: {
    id: p.integer().primary(),
    title: p.string(),
    kind: p.integer(),
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Doc, Plain],
    dbName: 'mikro_orm_test_compiled_query_cache',
    replicas: [{ name: 'read-1' }],
    preferReadReplicas: true,
  });
  await orm.schema.ensureDatabase();
  await orm.em.execute('drop schema if exists cqc_s1 cascade; drop schema if exists cqc_s2 cascade');
  await orm.schema.refresh();
  for (const schema of ['cqc_s1', 'cqc_s2']) {
    await orm.schema.update({ schema });
    const em = orm.em.fork({ schema });
    for (let i = 1; i <= 4; i++) {
      em.create(Doc, { id: i, title: `${schema} doc ${i}`, kind: i % 2 });
    }
    await em.flush();
  }
  const em = orm.em.fork();
  for (let i = 1; i <= 6; i++) {
    em.create(Plain, { id: i, title: `plain ${i}`, kind: i % 2 });
  }
  await em.flush();
});

afterAll(async () => {
  await orm.schema.dropDatabase();
  await orm.close(true);
});

afterEach(() => vi.restoreAllMocks());

test('forks with different schemas never share a compiled query', async () => {
  const hits = vi.spyOn(QueryBuilder.prototype, 'executeCompiled');

  for (let i = 0; i < 12; i++) {
    const schema = i % 2 ? 'cqc_s1' : 'cqc_s2';
    const docs = await orm.em.fork({ schema }).find(Doc, { kind: i % 2 });
    expect(docs.map(d => d.title).every(t => t.startsWith(schema))).toBe(true);
    const viaOption = await orm.em.fork().find(Doc, { kind: { $gte: 0 } }, { schema });
    expect(viaOption).toHaveLength(4);
    expect(viaOption.every(d => d.title.startsWith(schema))).toBe(true);
    expect(await orm.em.fork({ schema }).count(Doc, { kind: { $gte: 0 } })).toBe(4);
  }

  expect(hits.mock.calls.length).toBeGreaterThan(0);
});

test('compiled queries run in the transaction of the calling entity manager', async () => {
  const hits = vi.spyOn(QueryBuilder.prototype, 'executeCompiled');
  const find = (em: MikroORM['em'], title: string) => em.find(Plain, { title, kind: { $gte: 0 } });

  for (let i = 0; i < 3; i++) {
    await find(orm.em.fork(), `warm ${i}`);
  }

  hits.mockClear();
  const em = orm.em.fork();
  await em.begin();
  await em.insert(Plain, { id: 100, title: 'uncommitted', kind: 1 });
  expect(await find(em, 'uncommitted')).toHaveLength(1);
  expect(await em.count(Plain, { title: 'uncommitted' })).toBe(1);
  expect(await find(orm.em.fork(), 'uncommitted')).toHaveLength(0);
  await em.rollback();
  expect(await find(orm.em.fork(), 'uncommitted')).toHaveLength(0);
  expect(hits.mock.calls.length).toBe(3);
});

test('compiled queries use the same connection type as regular ones', async () => {
  const mock = mockLogger(orm, ['query']);
  const labels: string[] = [];
  const run = async (em: MikroORM['em'], i: number, options = {}) => {
    mock.mockClear();
    await em.find(Plain, { kind: i % 2, title: { $ne: 'conn' } }, options);
    await em.count(Plain, { kind: i % 2, title: { $ne: 'conn' } }, options);
    labels.push(mock.mock.calls.map(c => (c[0].includes('read-1') ? 'read' : 'write')).join(','));
  };

  for (let i = 0; i < 5; i++) {
    await run(orm.em.fork(), i);
    await run(orm.em.fork(), i, { connectionType: 'write' });
    await orm.em.fork().transactional(em => run(em, i));
  }

  expect(new Set(labels.filter((_, idx) => idx % 3 === 0)).size).toBe(1);
  expect(new Set(labels.filter((_, idx) => idx % 3 === 1)).size).toBe(1);
  expect(new Set(labels.filter((_, idx) => idx % 3 === 2)).size).toBe(1);
});
