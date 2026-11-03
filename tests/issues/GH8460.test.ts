import { MikroORM } from '@mikro-orm/sqlite';
import { Entity, ManyToOne, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { mockLogger } from '../helpers.js';

@Entity()
class Owner {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Property({ nullable: true })
  note?: string;
}

@Entity()
class Target {
  @PrimaryKey()
  id!: number;

  @Property()
  pid!: string;

  @Property({ nullable: true })
  col1?: string;

  @Property({ nullable: true })
  col2?: string;

  @ManyToOne(() => Owner, { nullable: true })
  owner?: Owner;
}

@Entity()
class Edge {
  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Target, { nullable: true })
  to?: Target;

  @ManyToOne(() => Target, { nullable: true })
  from?: Target;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: ':memory:',
    entities: [Owner, Target, Edge],
  });
  await orm.schema.refresh();

  const conn = orm.em.getConnection();
  await conn.execute(`insert into owner (id, name, note) values (1, 'o1', 'n1'), (2, 'o2', 'n2')`);
  await conn.execute(
    `insert into target (id, pid, col1, col2, owner_id) values (1, 'P1', 'a1', 'b1', 1), (2, 'P2', 'a2', 'b2', 2), (3, 'P3', 'a3', 'b3', null)`,
  );
  // the first edge points nowhere, so the first row of a joined result has only nulls for its target
  await conn.execute(
    `insert into edge (id, to_id, from_id) values (1, null, 3), (2, 1, 2), (3, 2, 1), (4, 1, null), (5, 3, 3)`,
  );
});

afterAll(async () => {
  await orm.close(true);
});

test('partially loaded joined relation is hydrated on every row (GH #8460)', async () => {
  const edges = await orm.em
    .fork()
    .find(Edge, {}, { populate: ['to'], fields: ['to.pid'], strategy: 'joined', orderBy: { id: 'asc' } });

  expect(edges.map(e => e.to?.pid ?? null)).toEqual([null, 'P1', 'P2', 'P1', 'P3']);
  expect((edges[1].to as Target).col1).toBeUndefined();
  expect((edges[2].to as Target).col2).toBeUndefined();
});

test('streamed partially loaded joined relation is hydrated on every row (GH #8460)', async () => {
  const stream = orm.em.fork().stream(Edge, { populate: ['to'], fields: ['to.pid'], orderBy: { id: 'asc' } });
  const edges: Edge[] = [];

  for await (const edge of stream) {
    edges.push(edge);
  }

  expect(edges.map(e => e.to?.pid ?? null)).toEqual([null, 'P1', 'P2', 'P1', 'P3']);
  expect((edges[1].to as Target).col1).toBeUndefined();
});

test('two join paths to the same entity keep their own selected columns (GH #8460)', async () => {
  const mock = mockLogger(orm, ['query']);
  const edges = await orm.em.fork().find(
    Edge,
    {},
    {
      populate: ['to', 'from.owner'],
      fields: ['to.pid', 'from.col1', 'from.owner.name'],
      strategy: 'joined',
      orderBy: { id: 'asc' },
    },
  );

  expect(edges.map(e => [e.to?.pid ?? null, e.from?.col1 ?? null, e.from?.owner?.name ?? null])).toEqual([
    [null, 'a3', null],
    ['P1', 'a2', 'o2'],
    ['P2', 'a1', 'o1'],
    ['P1', null, null],
    ['P3', 'a3', null],
  ]);
  expect((edges[1].from!.owner as Owner).note).toBeUndefined();
  // one joined query: nothing selected was left unmapped and reloaded
  expect(mock.mock.calls).toHaveLength(1);
});

test('fully loaded joined relation keeps every column (GH #8460)', async () => {
  const edges = await orm.em
    .fork()
    .find(Edge, {}, { populate: ['to.owner'], strategy: 'joined', orderBy: { id: 'asc' } });

  expect(edges.map(e => (e.to ? [e.to.pid, e.to.col1, e.to.col2, e.to.owner?.note ?? null] : null))).toEqual([
    null,
    ['P1', 'a1', 'b1', 'n1'],
    ['P2', 'a2', 'b2', 'n2'],
    ['P1', 'a1', 'b1', 'n1'],
    ['P3', 'a3', 'b3', null],
  ]);
});
