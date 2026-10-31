import { Collection, MikroORM } from '@mikro-orm/sqlite';
import { EntityFactory } from '@mikro-orm/core';
import {
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryKey,
  Property,
  ReflectMetadataProvider,
} from '@mikro-orm/decorators/legacy';
import { mockLogger } from '../helpers.js';

@Entity()
class Target {
  @PrimaryKey()
  id!: number;

  @Property()
  pid!: string;

  @Property({ nullable: true })
  col1?: string;

  @Property()
  active!: boolean;

  @Property()
  createdAt!: Date;

  @Property({ version: true })
  version!: number;

  @OneToMany(() => Edge, e => e.to)
  edges = new Collection<Edge>(this);
}

@Entity()
class Edge {
  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Target)
  to!: Target;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: ':memory:',
    entities: [Target, Edge],
  });
  await orm.schema.refresh();
});

beforeEach(async () => {
  await orm.schema.clear();
  const conn = orm.em.getConnection();
  await conn.execute(
    `insert into target (id, pid, col1, active, created_at, version) values (1, 'P1', 'a1', 1, '2020-01-01 00:00:00.000', 1), (2, 'P2', 'a2', 0, '2020-01-02 00:00:00.000', 1)`,
  );
  // many edges point to the same two targets, so most rows merge into an entity already in the identity map
  await conn.execute(`insert into edge (id, to_id) values (1, 1), (2, 2), (3, 1), (4, 2), (5, 1)`);
});

afterAll(async () => {
  await orm.close(true);
});

function findEdges(em: typeof orm.em, fields: string[] = ['to.pid']) {
  return em.find(Edge, {}, { populate: ['to'], fields: fields as any, strategy: 'joined', orderBy: { id: 'asc' } });
}

test('repeated joined rows merge without leaving changes to flush (GH #8460)', async () => {
  const em = orm.em.fork();
  const edges = await findEdges(em);

  expect(edges.map(e => e.to.pid)).toEqual(['P1', 'P2', 'P1', 'P2', 'P1']);
  expect(edges[0].to).toBe(edges[2].to);

  const mock = mockLogger(orm, ['query']);
  await em.flush();
  expect(mock.mock.calls).toHaveLength(0);
});

test('a value changed by the user survives a reload and is flushed (GH #8460)', async () => {
  const em = orm.em.fork();
  const [edge] = await findEdges(em);
  edge.to.pid = 'changed';

  await findEdges(em);
  expect(edge.to.pid).toBe('changed');

  await em.flush();
  const reloaded = await orm.em.fork().findOneOrFail(Target, 1);
  expect(reloaded.pid).toBe('changed');
});

test('a value changed in the database is merged on reload (GH #8460)', async () => {
  const em = orm.em.fork();
  const [edge] = await findEdges(em);
  await orm.em.getConnection().execute(`update target set pid = 'from-db' where id = 1`);

  await findEdges(em);
  expect(edge.to.pid).toBe('from-db');

  const mock = mockLogger(orm, ['query']);
  await em.flush();
  expect(mock.mock.calls).toHaveLength(0);
});

test('repeated rows with Date and boolean columns take the fast path (GH #8460)', async () => {
  const em = orm.em.fork();
  const spy = vi.spyOn(EntityFactory.prototype as any, 'isNoopMerge');
  const edges = await findEdges(em, ['to.pid', 'to.active', 'to.createdAt', 'to.version']);

  expect(spy.mock.results.map(r => r.value)).toEqual([true, true, true]);
  expect(edges[0].to.active).toBe(true);
  expect(edges[1].to.active).toBe(false);
  expect(edges[0].to.createdAt.toISOString()).toBe('2020-01-01T00:00:00.000Z');
  spy.mockRestore();

  const mock = mockLogger(orm, ['query']);
  await em.flush();
  expect(mock.mock.calls).toHaveLength(0);
});

test('a version bumped in the database is merged on reload (GH #8460)', async () => {
  const em = orm.em.fork();
  const [edge] = await findEdges(em, ['to.pid', 'to.version']);
  expect(edge.to.version).toBe(1);
  await orm.em.getConnection().execute(`update target set version = 2 where id = 1`);

  await findEdges(em, ['to.pid', 'to.version']);
  expect(edge.to.version).toBe(2);

  const mock = mockLogger(orm, ['query']);
  await em.flush();
  expect(mock.mock.calls).toHaveLength(0);
});

test('a reference is initialized by the joined rows (GH #8460)', async () => {
  const em = orm.em.fork();
  const ref = em.getReference(Target, 1);
  expect(ref.pid).toBeUndefined();

  await findEdges(em);
  expect(ref.pid).toBe('P1');
});

test('a column selected by a later query is merged in (GH #8460)', async () => {
  const em = orm.em.fork();
  const [edge] = await findEdges(em);
  expect(edge.to.col1).toBeUndefined();

  await findEdges(em, ['to.pid', 'to.col1']);
  expect(edge.to.col1).toBe('a1');
});

test('a reference merged with only its primary key gets its collections (GH #8460)', async () => {
  const em = orm.em.fork();
  const ref = em.getReference(Target, 1);

  await findEdges(em, ['to.id']);
  expect(ref.edges).toBeInstanceOf(Collection);
});
