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

async function bootstrap<T extends new (...args: any[]) => any>(initial: T) {
  const orm = await MikroORM.init({
    driver: MsSqlDriver,
    metadataProvider: ReflectMetadataProvider,
    entities: [initial],
    dbName: `mikro_orm_test_collation`,
    password: 'Root.Root',
  });
  await orm.schema.refresh();
  return orm;
}

describe('collation diffing [mssql]', () => {
  test('create schema emits column-level collate clause', async () => {
    const orm = await bootstrap(Book1);
    const sql = await orm.schema.getCreateSchemaSQL();
    expect(sql).toContain('collate Latin1_General_BIN');
    expect(sql).toMatchSnapshot();
    await orm.close(true);
  });

  test('schema introspection round-trips column collation', async () => {
    const orm = await bootstrap(Book1);
    await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');
    await orm.close(true);
  });

  test('explicit-to-explicit collation change produces an alter', async () => {
    const orm = await bootstrap(Book1);
    orm.discoverEntity(Book2, Book1);
    const diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toContain('collate Latin1_General_CS_AS');
    expect(diff).toMatchSnapshot();
    await orm.schema.execute(diff);
    await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');
    await orm.close(true);
  });

  test('dropping the property collation alters the column back to the db default', async () => {
    const orm = await bootstrap(Book1);
    orm.discoverEntity(Book0, Book1);
    const diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).not.toContain('collate Latin1_General_BIN');
    expect(diff).toMatch(/alter table .* alter column/i);
    expect(diff).toMatchSnapshot();
    await orm.schema.execute(diff);
    await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');
    await orm.close(true);
  });
});
