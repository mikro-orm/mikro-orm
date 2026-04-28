import { MikroORM } from '@mikro-orm/mariadb';
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

  @Property({ length: 26, collation: 'utf8mb4_bin' })
  code!: string;

  @Property()
  name!: string;
}

@Entity({ tableName: 'book' })
class Book2 {
  @PrimaryKey()
  id!: number;

  @Property({ length: 26, collation: 'utf8mb4_unicode_ci' })
  code!: string;

  @Property()
  name!: string;
}

async function bootstrap<T extends new (...args: any[]) => any>(
  initial: T,
  dbName = 'mikro_orm_test_collation_mariadb',
) {
  const orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [initial],
    dbName,
    port: 3309,
  });
  await orm.schema.ensureDatabase();
  await orm.schema.execute('drop table if exists book');
  await orm.schema.create();
  return orm;
}

describe('collation diffing [mariadb]', () => {
  test('create schema emits column-level collate clause', async () => {
    const orm = await bootstrap(Book1);
    const sql = await orm.schema.getCreateSchemaSQL();
    expect(sql).toContain('collate utf8mb4_bin');
    expect(sql).toMatchSnapshot();
    await orm.close(true);
  });

  test('schema introspection round-trips column collation', async () => {
    const orm = await bootstrap(Book1);
    await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');
    await orm.close(true);
  });

  test('explicit-to-explicit collation change produces a modify', async () => {
    const orm = await bootstrap(Book1);
    orm.discoverEntity(Book2, Book1);
    const diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toContain('collate utf8mb4_unicode_ci');
    expect(diff).toMatchSnapshot();
    await orm.schema.execute(diff);
    await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');
    await orm.close(true);
  });

  test('dropping the property collation modifies the column back to the table default', async () => {
    const orm = await bootstrap(Book1);
    orm.discoverEntity(Book0, Book1);
    const diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).not.toContain('collate utf8mb4_bin');
    expect(diff).toMatch(/alter table .* modify/i);
    expect(diff).toMatchSnapshot();
    await orm.schema.execute(diff);
    await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');
    await orm.close(true);
  });
});
