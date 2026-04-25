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

describe('collation diffing [sqlite]', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [Book1],
      dbName: ':memory:',
    });
    await orm.schema.create();
  });

  afterAll(() => orm.close(true));

  test('create schema emits column-level collate clause', async () => {
    const sql = await orm.schema.getCreateSchemaSQL();
    expect(sql).toContain('collate NOCASE');
    expect(sql).toMatchSnapshot();
  });

  test('schema introspection round-trips column collation', async () => {
    await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');
  });

  test('explicit-to-explicit collation change rebuilds the table', async () => {
    orm.discoverEntity(Book2, Book1);
    const diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot();
    await orm.schema.execute(diff);
  });

  test('dropping the property collation is a no-op (accept default)', async () => {
    orm.discoverEntity(Book0, Book2);
    await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');
  });

  test('adding a collation to an existing column is detected as a change', async () => {
    const orm2 = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [Book0],
      dbName: ':memory:',
    });
    await orm2.schema.create();
    orm2.discoverEntity(Book1, Book0);
    const diff = await orm2.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toContain('collate NOCASE');
    await orm2.close(true);
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

    orm.discoverEntity(BookIgnored, Book0);
    await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');
  });
});
