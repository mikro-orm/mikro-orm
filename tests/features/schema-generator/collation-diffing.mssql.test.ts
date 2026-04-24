import { MikroORM, MsSqlDriver } from '@mikro-orm/mssql';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity({ tableName: 'book' })
class Book0 {
  @PrimaryKey()
  id!: number;

  @Property({ length: 26 })
  code!: string;

  @Property()
  name!: string;
}

@Entity({ tableName: 'book' })
class Book1 {
  @PrimaryKey()
  id!: number;

  @Property({ length: 26, collation: 'Latin1_General_BIN' })
  code!: string;

  @Property()
  name!: string;
}

@Entity({ tableName: 'book' })
class Book2 {
  @PrimaryKey()
  id!: number;

  @Property({ length: 26, collation: 'Latin1_General_CS_AS' })
  code!: string;

  @Property()
  name!: string;
}

describe('collation diffing in mssql', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      driver: MsSqlDriver,
      metadataProvider: ReflectMetadataProvider,
      entities: [Book1],
      dbName: `mikro_orm_test_collation`,
      password: 'Root.Root',
    });
    await orm.schema.refresh();
  });

  afterAll(() => orm.close(true));

  test('create schema emits column-level collate clause', async () => {
    const sql = await orm.schema.getCreateSchemaSQL();
    expect(sql).toContain('collate Latin1_General_BIN');
    expect(sql).toMatchSnapshot();
  });

  test('schema introspection round-trips column collation', async () => {
    await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');
  });

  test('explicit-to-explicit collation change produces an alter', async () => {
    orm.discoverEntity(Book2, Book1);
    const diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot();
    await orm.schema.execute(diff);
  });

  test('dropping the property collation is a no-op (accept db default)', async () => {
    orm.discoverEntity(Book0, Book2);
    await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');
  });
});
