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

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [Book1],
    schema: 'foo',
    dbName: `mikro_orm_test_collation`,
  });
  await orm.schema.refresh();
});

afterAll(() => orm.close(true));

test('create schema emits column-level collate clause', async () => {
  const sql = await orm.schema.getCreateSchemaSQL();
  expect(sql).toContain('collate "C"');
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

test('dropping the property collation is a no-op (accept platform default)', async () => {
  orm.discoverEntity(Book0, Book2);
  await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');
});

test('re-adding a matching collation against live DB state produces no diff', async () => {
  // Book1 specifies `collation: 'C'`; the live DB column was set to 'POSIX' via the previous step,
  // so this round-trip still emits an alter. Using Book2 (the DB's current collation) should be a no-op.
  orm.discoverEntity(Book2, Book0);
  await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');
});
