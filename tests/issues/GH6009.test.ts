import { Entity, MikroORM, PrimaryKey, Property } from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';

@Entity()
class User {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Property({ unique: true })
  email!: string;

}

describe('GH #6009 [postgres]', () => {
  let orm: MikroORM<PostgreSqlDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [User],
      dbName: '6009',
      driver: PostgreSqlDriver,
    });
    await orm.schema.refreshDatabase();
  });

  beforeEach(async () => {
    await orm.schema.clearDatabase();
  });

  afterAll(() => orm.close());

  test('multi-statement sql - "all"', async () => {
    const sql = `INSERT INTO "user" ("name", "email") VALUES ('name', 'email'); SELECT * from "user";`;
    const res = await orm.em.execute(sql, [], 'all');
    expect(res).toEqual([[], [{ id: 1, name: 'name', email: 'email' }]]);
  });

  test('multi-statement sql - "get"', async () => {
    const sql = `INSERT INTO "user" ("name", "email") VALUES ('name', 'email'); SELECT * from "user";`;
    const res = await orm.em.execute(sql, [], 'get');
    expect(res).toEqual([undefined, { id: 1, name: 'name', email: 'email' }]);
  });

  test('multi-statement sql - "run"', async () => {
    const sql = `INSERT INTO "user" ("name", "email") VALUES ('name', 'email'); SELECT * from "user";`;
    const res = await orm.em.execute(sql, [], 'run');
    expect(res).toEqual([
      { affectedRows: 1, insertId: 0, rows: [] },
      {
        affectedRows: 1,
        insertId: 1,
        row: { email: 'email', id: 1, name: 'name' },
        rows: [
          { email: 'email', id: 1, name: 'name' },
        ],
      },
    ]);
  });

});
