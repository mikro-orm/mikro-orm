import { MikroORM } from '@mikro-orm/sqlite';
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

  @Property({ length: 26, collation: 'NOCASE' })
  code!: string;

  @Property()
  name!: string;
}

@Entity({ tableName: 'book' })
class Book2 {
  @PrimaryKey()
  id!: number;

  @Property({ length: 26, collation: 'BINARY' })
  code!: string;

  @Property()
  name!: string;
}

async function bootstrap<T extends new (...args: any[]) => any>(initial: T) {
  const orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [initial],
    dbName: ':memory:',
  });
  await orm.schema.create();
  return orm;
}

describe('collation diffing [sqlite]', () => {
  test('create schema emits column-level collate clause', async () => {
    const orm = await bootstrap(Book1);
    const sql = await orm.schema.getCreateSchemaSQL();
    expect(sql).toContain('collate NOCASE');
    expect(sql).toMatchSnapshot();
    await orm.close(true);
  });

  test('schema introspection round-trips column collation', async () => {
    const orm = await bootstrap(Book1);
    await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');
    await orm.close(true);
  });

  test('explicit-to-explicit collation change rebuilds the table', async () => {
    const orm = await bootstrap(Book1);
    orm.discoverEntity(Book2, Book1);
    const diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toContain('collate BINARY');
    expect(diff).toMatchSnapshot();
    await orm.schema.execute(diff);
    await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');
    await orm.close(true);
  });

  test('dropping the property collation rebuilds the column without COLLATE', async () => {
    const orm = await bootstrap(Book1);
    orm.discoverEntity(Book0, Book1);
    const diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).not.toContain('collate');
    expect(diff).toMatchSnapshot();
    await orm.schema.execute(diff);
    await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');
    await orm.close(true);
  });

  test('adding a collation to an existing column is detected as a change', async () => {
    const orm = await bootstrap(Book0);
    orm.discoverEntity(Book1, Book0);
    const diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toContain('collate NOCASE');
    await orm.schema.execute(diff);
    await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');
    await orm.close(true);
  });

  test('ignoreSchemaChanges: [collation] suppresses diffs even when collation changes', async () => {
    @Entity({ tableName: 'book' })
    class BookIgnored {
      @PrimaryKey()
      id!: number;

      @Property({
        length: 26,
        collation: 'NOCASE',
        ignoreSchemaChanges: ['collation'],
      })
      code!: string;

      @Property()
      name!: string;
    }

    const orm = await bootstrap(Book2);
    orm.discoverEntity(BookIgnored, Book2);
    await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');
    await orm.close(true);
  });
});
