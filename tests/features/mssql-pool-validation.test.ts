import { MikroORM } from '@mikro-orm/mssql';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { Connection } from 'tedious';

@Entity()
class Book {
  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;
}

let orm: MikroORM;
const created: Connection[] = [];

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [Book],
    dbName: 'mssql-pool-validation',
    password: 'Root.Root',
    onCreateConnection: async connection => {
      created.push(connection as Connection);
    },
  });
  await orm.schema.refresh();
});

afterAll(() => orm.close(true));

test('queries outside a transaction do not run an extra validation query', async () => {
  const execSql = vi.spyOn(Connection.prototype, 'execSql');

  for (let i = 0; i < 5; i++) {
    await orm.em.fork().find(Book, {});
  }

  const sql = execSql.mock.calls.map(([request]) => request.sqlTextOrProcedure);
  execSql.mockRestore();

  expect(sql.filter(q => q === 'select 1')).toHaveLength(0);
  expect(sql).toHaveLength(5);
});

test('closed pooled connection is not handed out again', async () => {
  await orm.em.fork().find(Book, {});
  const idle = created.filter(connection => !connection.closed);
  expect(idle.length).toBeGreaterThan(0);

  for (const connection of idle) {
    await new Promise(resolve => connection.once('end', resolve).close());
  }

  const count = created.length;
  await expect(orm.em.fork().find(Book, {})).resolves.toEqual([]);
  expect(created).toHaveLength(count + 1);
  expect(created.at(-1)!.closed).toBe(false);
});

test('pooled connection with a socket error is not handed out again', async () => {
  await orm.em.fork().find(Book, {});
  const idle = created.filter(connection => !connection.closed);
  expect(idle.length).toBeGreaterThan(0);
  const error = vi.spyOn(console, 'error').mockReturnValue();

  for (const connection of idle) {
    await new Promise(resolve => {
      connection.once('end', resolve);
      (connection as any).socket.destroy(new Error('socket failure'));
    });
  }

  const count = created.length;
  await expect(orm.em.fork().find(Book, {})).resolves.toEqual([]);
  error.mockRestore();
  expect(created).toHaveLength(count + 1);
});
