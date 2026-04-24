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

describe('collation diffing in mysql', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [Book1],
      dbName: `mikro_orm_test_collation`,
      port: 3308,
    });
    await orm.schema.ensureDatabase();
    await orm.schema.execute('drop table if exists book');
    await orm.schema.create();
  });

  afterAll(() => orm.close(true));

  test('create schema emits column-level collate clause', async () => {
    const sql = await orm.schema.getCreateSchemaSQL();
    expect(sql).toContain('collate utf8mb4_bin');
    expect(sql).toMatchSnapshot();
  });

  test('schema introspection round-trips column collation', async () => {
    await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');
  });

  test('explicit-to-explicit collation change produces a modify', async () => {
    orm.discoverEntity(Book2, Book1);
    const diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot();
    await orm.schema.execute(diff);
  });

  test('dropping the property collation is a no-op (accept table default)', async () => {
    orm.discoverEntity(Book0, Book2);
    await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');
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
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [BookMinimal],
      dbName: `mikro_orm_test_collation_default`,
      port: 3308,
    });
    await orm.schema.ensureDatabase();
    await orm.schema.execute('drop table if exists book');
    await orm.schema.create();
  });

  afterAll(() => orm.close(true));

  test('explicit table-default collation is a no-op diff', async () => {
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
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [BookBinNoComment],
      dbName: `mikro_orm_test_collation_comment`,
      port: 3308,
    });
    await orm.schema.ensureDatabase();
    await orm.schema.execute('drop table if exists book');
    await orm.schema.create();
  });

  afterAll(() => orm.close(true));

  test('adding a comment re-emits the existing collation', async () => {
    orm.discoverEntity(BookBinWithComment, BookBinNoComment);
    const diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toContain('collate utf8mb4_bin');
    expect(diff).toContain("comment 'the code'");
    await orm.schema.execute(diff);
    await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');
  });
});
