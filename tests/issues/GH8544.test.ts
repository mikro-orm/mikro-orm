import { Entity, MikroORM, PrimaryKey, Property } from '@mikro-orm/mssql';
import type { EntityManager } from '@mikro-orm/mssql';

@Entity()
class Note {

  @PrimaryKey()
  id!: number;

  @Property()
  text!: string;

}

let orm: MikroORM;

// keeps the connection busy long enough for the sibling queries to pile up, and reports which connection ran it
async function slowSpid(em: EntityManager): Promise<number> {
  const [row] = await em.execute<{ spid: number }[]>(`waitfor delay '00:00:00.050'; select @@SPID as spid`);
  return row.spid;
}

async function spid(em: EntityManager): Promise<number> {
  const [row] = await em.execute<{ spid: number }[]>('select @@SPID as spid');
  return row.spid;
}

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Note],
    dbName: 'mikro_orm_test_mssql_parallel_queries',
    password: 'Root.Root',
  });
  await orm.schema.refreshDatabase();
});

afterAll(() => orm.close(true));

test('queries issued in parallel inside concurrent transactions run on their own connection', async () => {
  const results = await Promise.all([1, 2, 3].map(() => orm.em.fork().transactional(async em => {
    const own = await spid(em);
    const ranOn = await Promise.all([slowSpid(em), slowSpid(em), slowSpid(em), slowSpid(em)]);
    return { own, ranOn };
  })));

  for (const { own, ranOn } of results) {
    expect(ranOn).toEqual([own, own, own, own]);
  }

  expect(new Set(results.map(result => result.own)).size).toBe(3);
});

test('a nested transaction waits for the in-flight queries before creating its savepoint', async () => {
  await orm.em.fork().transactional(async em => {
    const own = await spid(em);
    const [ranOn, nested] = await Promise.all([
      slowSpid(em),
      em.transactional(inner => slowSpid(inner)),
    ]);
    expect(ranOn).toBe(own);
    expect(nested).toBe(own);
  });
});

test('a failing query rolls back while its siblings are in flight and leaves a clean pooled connection', async () => {
  // a single connection, so the next query is guaranteed to reuse the one the failed transaction ran on
  const singleConnection = await MikroORM.init({
    entities: [Note],
    dbName: 'mikro_orm_test_mssql_parallel_queries',
    password: 'Root.Root',
    pool: { min: 1, max: 1 },
  });

  try {
    await expect(singleConnection.em.fork().transactional(async em => {
      em.create(Note, { text: 'rolled back' });
      await em.flush();
      await Promise.all([
        em.execute('select 1/0 as boom'),
        slowSpid(em),
        slowSpid(em),
      ]);
    })).rejects.toThrow(/Divide by zero/);

    const em = singleConnection.em.fork();
    const [{ trancount }] = await em.execute<{ trancount: number }[]>('select @@TRANCOUNT as trancount');
    expect(trancount).toBe(0);
    expect(await em.count(Note)).toBe(0);
  } finally {
    await singleConnection.close(true);
  }
});
