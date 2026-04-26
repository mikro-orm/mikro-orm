import { MikroORM } from '@mikro-orm/postgresql';
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

  @Property({ length: 26, collation: 'C' })
  code!: string;

  @Property()
  name!: string;
}

@Entity({ tableName: 'book' })
class Book2 {
  @PrimaryKey()
  id!: number;

  @Property({ length: 26, collation: 'POSIX' })
  code!: string;

  @Property()
  name!: string;
}

async function bootstrap<T extends new (...args: any[]) => any>(initial: T) {
  const orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [initial],
    schema: 'foo',
    dbName: `mikro_orm_test_collation`,
  });
  await orm.schema.refresh();
  return orm;
}

describe('collation diffing [postgres]', () => {
  test('create schema emits column-level collate clause', async () => {
    const orm = await bootstrap(Book1);
    const sql = await orm.schema.getCreateSchemaSQL();
    expect(sql).toContain('collate "C"');
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
    expect(diff).toContain('collate "POSIX"');
    expect(diff).toMatchSnapshot();
    await orm.schema.execute(diff);
    await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');
    await orm.close(true);
  });

  test('dropping the property collation alters the column back to the platform default', async () => {
    const orm = await bootstrap(Book1);
    orm.discoverEntity(Book0, Book1);
    const diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).not.toContain('collate "C"');
    expect(diff).toMatch(/alter table .* alter column/i);
    expect(diff).toMatchSnapshot();
    await orm.schema.execute(diff);
    await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');
    await orm.close(true);
  });
});
