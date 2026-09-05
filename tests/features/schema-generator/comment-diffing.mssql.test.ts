import { MikroORM, MsSqlDriver } from '@mikro-orm/mssql';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity({ tableName: 'book' })
class Book0 {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;
}

@Entity({ tableName: 'book', comment: "this is book's table" })
class Book1 {
  @PrimaryKey({ comment: "this is primary's key" })
  id!: number;

  @Property({ comment: 'this is name of book' })
  name!: string;
}

@Entity({ tableName: 'book', comment: 'table comment' })
class Book2 {
  @PrimaryKey({ comment: 'new comment' })
  id!: number;

  @Property({ comment: '' })
  name!: string;
}

@Entity({ tableName: 'book' })
class Book3 {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;
}

@Entity({ tableName: 'book' })
class Book4 {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Property({ nullable: true, comment: 'comment of a newly added column' })
  description?: string;
}

async function bootstrap(schema?: string) {
  const orm = await MikroORM.init({
    driver: MsSqlDriver,
    metadataProvider: ReflectMetadataProvider,
    entities: [Book0],
    dbName: `mikro_orm_test_comments`,
    password: 'Root.Root',
    schema,
  });
  await orm.schema.refresh();
  return orm;
}

describe('comment diffing [mssql]', () => {
  test('adding, changing and removing table and column comments', async () => {
    const orm = await bootstrap();

    orm.discoverEntity(Book1, Book0);
    const diff1 = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff1).toMatchSnapshot();
    await orm.schema.execute(diff1);
    await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');

    orm.discoverEntity(Book2, Book1);
    const diff2 = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff2).toMatchSnapshot();
    await orm.schema.execute(diff2);
    await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');

    orm.discoverEntity(Book3, Book2);
    const diff3 = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff3).toMatchSnapshot();
    await orm.schema.execute(diff3);
    await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');

    orm.discoverEntity(Book4, Book3);
    const diff4 = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff4).toMatchSnapshot();
    await orm.schema.execute(diff4);
    await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');

    await orm.close(true);
  });

  test('comments are diffed in a non-default schema', async () => {
    const orm = await bootstrap('foo');

    orm.discoverEntity(Book1, Book0);
    const diff1 = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff1).toMatchSnapshot();
    await orm.schema.execute(diff1);
    await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');

    orm.discoverEntity(Book3, Book1);
    const diff2 = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff2).toMatchSnapshot();
    await orm.schema.execute(diff2);
    await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');

    await orm.close(true);
  });
});
