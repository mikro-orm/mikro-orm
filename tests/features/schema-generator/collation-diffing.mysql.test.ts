import { MikroORM } from '@mikro-orm/mysql';
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

async function bootstrap<T extends new (...args: any[]) => any>(initial: T, dbName = 'mikro_orm_test_collation') {
  const orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [initial],
    dbName,
    port: 3308,
  });
  await orm.schema.ensureDatabase();
  await orm.schema.execute('drop table if exists book');
  await orm.schema.create();
  return orm;
}

describe('collation diffing [mysql]', () => {
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

// Regression: a property explicitly naming the table default collation must not flap
// against MySQL's filtered introspection (the nullif collapses the value to null).
@Entity({ tableName: 'book' })
class BookMinimal {
  @PrimaryKey()
  id!: number;

  @Property({ length: 26 })
  code!: string;
}

describe('property naming the table default collation does not flap [mysql]', () => {
  test('explicit table-default collation is a no-op diff', async () => {
    const orm = await bootstrap(BookMinimal, 'mikro_orm_test_collation_default');
    const [{ c: tableDefault }] = await orm.em
      .getConnection()
      .execute<{ c: string }[]>(
        "select table_collation as c from information_schema.tables where table_schema = database() and table_name = 'book'",
      );

    @Entity({ tableName: 'book' })
    class BookExplicitDefault {
      @PrimaryKey()
      id!: number;

      @Property({ length: 26, collation: tableDefault })
      code!: string;
    }

    orm.discoverEntity(BookExplicitDefault, BookMinimal);
    await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');
    await orm.close(true);
  });
});

// Regression: MySQL MODIFY/CHANGE resets omitted attributes; adding a comment to a collated
// column must carry the existing collation through `getColumnDeclarationSQL` so the table
// default doesn't silently replace it.
@Entity({ tableName: 'book' })
class BookBinNoComment {
  @PrimaryKey()
  id!: number;

  @Property({ length: 26, collation: 'utf8mb4_bin' })
  code!: string;

  @Property()
  name!: string;
}

@Entity({ tableName: 'book' })
class BookBinWithComment {
  @PrimaryKey()
  id!: number;

  @Property({ length: 26, collation: 'utf8mb4_bin', comment: 'the code' })
  code!: string;

  @Property()
  name!: string;
}

describe('comment-only edit preserves column collation [mysql]', () => {
  test('adding a comment re-emits the existing collation', async () => {
    const orm = await bootstrap(BookBinNoComment, 'mikro_orm_test_collation_comment');
    orm.discoverEntity(BookBinWithComment, BookBinNoComment);
    const diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toContain('collate utf8mb4_bin');
    expect(diff).toContain("comment 'the code'");
    await orm.schema.execute(diff);
    await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');
    await orm.close(true);
  });
});
