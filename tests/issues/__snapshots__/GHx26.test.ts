import { EntitySchema, MikroORM, PrimaryKeyProp } from '@mikro-orm/postgresql';

class TestTable {

  [PrimaryKeyProp]?: 'id';
  id!: number;
  rank!: number;

}

const TestTableSchema = new EntitySchema({
  class: TestTable,
  tableName: '_test_table',
  properties: {
    id: { primary: true, type: 'integer', autoincrement: false },
    rank: { type: 'integer' },
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [
      TestTable,
    ],
    dbName: 'ghx26',
  });
});

afterAll(() => orm.close(true));

test('non-autoincrement PK in postgres', async () => {
  await orm.schema.refreshDatabase();
});
