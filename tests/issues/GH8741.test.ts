import { type Dictionary, MikroORM } from '@mikro-orm/mssql';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { Connection } from 'tedious';

@Entity()
class Book {
  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;
}

function initORM(driverOptions?: Dictionary) {
  return MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [Book],
    dbName: '8741',
    password: 'Root.Root',
    driverOptions,
  });
}

// every `find` outside a transaction checks a connection out of the pool and returns it afterwards
async function runQueries(orm: MikroORM) {
  // connect first, so the `ensureDatabase` check is not counted
  await orm.em.fork().find(Book, {});

  const execSql = vi.spyOn(Connection.prototype, 'execSql');
  const reset = vi.spyOn(Connection.prototype, 'reset');

  try {
    for (let i = 0; i < 5; i++) {
      await orm.em.fork().find(Book, {});
    }

    return {
      sql: execSql.mock.calls.map(([request]) => (request as any).sqlTextOrProcedure as string),
      resets: reset.mock.calls.length,
    };
  } finally {
    execSql.mockRestore();
    reset.mockRestore();
  }
}

beforeAll(async () => {
  const orm = await initORM();
  await orm.schema.refresh();
  await orm.close(true);
});

test('connections are validated with `select 1` on checkout by default', async () => {
  const orm = await initORM();

  try {
    const { sql, resets } = await runQueries(orm);
    expect(sql.filter(q => q === 'select 1')).toHaveLength(5);
    expect(sql).toHaveLength(10);
    expect(resets).toBe(0);
  } finally {
    await orm.close(true);
  }
});

test('GH #8741: `validateConnections: false` skips the validation query', async () => {
  const orm = await initORM({ validateConnections: false });

  try {
    const { sql } = await runQueries(orm);
    expect(sql.filter(q => q === 'select 1')).toHaveLength(0);
    expect(sql).toHaveLength(5);
  } finally {
    await orm.close(true);
  }
});

test('GH #8741: `resetConnectionsOnRelease: true` resets connections returned to the pool', async () => {
  const orm = await initORM({ resetConnectionsOnRelease: true });

  try {
    const { resets } = await runQueries(orm);
    expect(resets).toBe(5);
  } finally {
    await orm.close(true);
  }
});
