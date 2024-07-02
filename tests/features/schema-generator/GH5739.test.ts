import { MikroORM, Entity, PrimaryKey, Property } from '@mikro-orm/postgresql';

@Entity()
class Foo {

  @PrimaryKey()
  id!: string;

  @Property({
    type: 'vector',
    length: 1024,
    nullable: true,
  })
  embedding1?: unknown;

  @Property({
    type: 'vector(1024)',
    nullable: true,
  })
  embedding2?: unknown;

  @Property({
    columnType: 'vector(1024)',
    nullable: true,
  })
  embedding3?: unknown;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Foo],
    dbName: '5739',
  });
  await orm.schema.execute('create extension if not exists vector');
  await orm.schema.refreshDatabase();
});

afterAll(() => orm.close(true));

test('GH #5739', async () => {
  const sql = await orm.schema.getCreateSchemaSQL();
  expect(sql).toMatchSnapshot();
  const diff = await orm.schema.getUpdateSchemaMigrationSQL();
  expect(diff).toMatchObject({ up: '', down: '' });
  await orm.schema.dropSchema();
  const diff2 = await orm.schema.getUpdateSchemaMigrationSQL();
  expect(diff2).toMatchSnapshot();
});
