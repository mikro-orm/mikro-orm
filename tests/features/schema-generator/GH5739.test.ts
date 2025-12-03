import { MikroORM } from '@mikro-orm/postgresql';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
class Foo {

  @PrimaryKey()
  id!: string;

  @Property({
    type: 'vector',
    nullable: true,
  })
  embedding0?: unknown;

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

@Entity({ tableName: 'foo' })
class Foo2 {

  @PrimaryKey()
  id!: string;

  @Property({
    type: 'vector',
    nullable: true,
    length: 1024,
  })
  embedding0?: unknown;

  @Property({
    type: 'vector',
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
    metadataProvider: ReflectMetadataProvider,
    entities: [Foo],
    dbName: '5739',
  });
  await orm.schema.execute('create extension if not exists vector');
  await orm.schema.refresh();
});

afterAll(() => orm.close(true));

test('GH #5739', async () => {
  const sql = await orm.schema.getCreateSchemaSQL();
  expect(sql).toMatchSnapshot();
  const diff = await orm.schema.getUpdateSchemaMigrationSQL();
  expect(diff).toMatchObject({ up: '', down: '' });
  await orm.schema.drop();
  const diff2 = await orm.schema.getUpdateSchemaMigrationSQL();
  expect(diff2).toMatchSnapshot();
  await orm.schema.execute(diff2.up);

  orm.discoverEntity(Foo2, 'Foo');
  const diff3 = await orm.schema.getUpdateSchemaMigrationSQL();
  expect(diff3).toMatchSnapshot();
});
