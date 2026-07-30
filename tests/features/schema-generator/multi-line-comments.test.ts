import { DatabaseSchema, MikroORM as MsSqlORM } from '@mikro-orm/mssql';
import { MikroORM as PgliteORM } from '@mikro-orm/pglite';
import { MikroORM as MySqlORM } from '@mikro-orm/mysql';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

// the trailing whitespace, the `;\n`, the blank line and the indentation used to be destroyed by the
// line based query batch grouping in `SqlSchemaGenerator.execute()`
const COMMENT = `line one   \n  line two;\n\n  line three's end`;
const COLUMN_COMMENT = `column line one   \n  column line two;\n\n  column line three`;

@Entity({ tableName: 'book', comment: COMMENT })
class Book {
  @PrimaryKey()
  id!: number;

  @Property({ nullable: true, comment: COLUMN_COMMENT })
  name?: string;
}

// mysql keeps all comments on the single `create table` line, so the odd number of apostrophes above
// only shows when another statement follows and gets swallowed as part of the comment
@Entity({ tableName: 'shelf' })
class Shelf {
  @PrimaryKey()
  id!: number;
}

// the apostrophe here is no string literal, the statements that follow must stay separate
@Entity({ tableName: `it's` })
class Weird {
  @PrimaryKey()
  id!: number;
}

@Entity({ tableName: 'zzz' })
class Zzz {
  @PrimaryKey()
  id!: number;
}

async function assertComments(orm: MsSqlORM | PgliteORM | MySqlORM) {
  const dbSchema = await DatabaseSchema.create(orm.em.getConnection(), orm.em.getPlatform(), orm.config);
  const table = dbSchema.getTable('book')!;
  expect(table.comment).toBe(COMMENT);
  expect(table.getColumn('name')!.comment).toBe(COLUMN_COMMENT);

  await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');
}

describe('multi line comments', () => {
  test('multi line comment survives create and produces no schema diff [mssql]', async () => {
    const orm = await MsSqlORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [Book, Shelf],
      dbName: `mikro_orm_test_multiline_comment`,
      password: 'Root.Root',
    });
    await orm.schema.refresh();
    await assertComments(orm);
    await orm.schema.dropDatabase();
    await orm.close(true);
  });

  test('multi line comment survives create and produces no schema diff [postgres]', async () => {
    const orm = await PgliteORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [Book, Shelf],
      dbName: 'memory://',
    });
    await orm.schema.create();
    await assertComments(orm);
    await orm.close(true);
  });

  test('multi line comment survives create and produces no schema diff [mysql]', async () => {
    const orm = await MySqlORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [Book, Shelf],
      dbName: `mikro_orm_test_multiline_comment`,
      port: 3308,
    });
    await orm.schema.refresh();
    await assertComments(orm);
    await orm.schema.dropDatabase();
    await orm.close(true);
  });

  test('apostrophes outside string literals are no statement boundary [postgres]', async () => {
    const orm = await PgliteORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [Weird, Zzz],
      dbName: 'memory://',
    });

    await orm.schema.create();
    await orm.schema.execute(
      `-- don't take this for a literal\ncreate table a (id int);\n\ncreate table b (id int);\n`,
    );
    const dbSchema = await DatabaseSchema.create(orm.em.getConnection(), orm.em.getPlatform(), orm.config);
    expect(
      dbSchema
        .getTables()
        .map(t => t.name)
        .sort(),
    ).toEqual(['a', 'b', `it's`, 'zzz']);
    await orm.close(true);
  });
});
