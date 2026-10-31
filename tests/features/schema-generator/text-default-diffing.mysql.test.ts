import { DatabaseSchema, MikroORM } from '@mikro-orm/mysql';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
class Post {
  @PrimaryKey()
  id!: number;

  // MySQL reports text defaults back with a charset introducer, e.g. `_utf8mb4\'draft\'`
  @Property({ type: 'text', default: 'draft' })
  body!: string;

  @Property({ columnType: 'mediumtext', default: 'none' })
  summary!: string;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [Post],
    dbName: `text-default-diffing`,
    port: 3308,
  });
  await orm.schema.refresh();
});

afterAll(() => orm.close(true));

test('tiny/medium/long text defaults are wrapped as expressions', async () => {
  const sql = await orm.schema.getCreateSchemaSQL({ wrap: false });
  expect(sql).toContain("`body` text not null default ('draft')");
  expect(sql).toContain("`summary` mediumtext not null default ('none')");
});

test('text column with a string default is not churned', async () => {
  const diff = await orm.schema.getUpdateSchemaMigrationSQL({ wrap: false });
  expect(diff).toEqual({ up: '', down: '' });
});

test('escaped text defaults are introspected as plain literals', async () => {
  const connection = orm.em.getConnection();
  await connection.execute(
    `create table escaped_defaults (id int primary key, quote text default ('it''s'), backslash text default ('a\\\\b'), newline text default ('a\\nb'))`,
  );

  try {
    const schema = await DatabaseSchema.create(connection, orm.em.getPlatform(), orm.config);
    const defaults = schema
      .getTable('escaped_defaults')!
      .getColumns()
      .map(col => col.default);
    expect(defaults).toEqual([null, `'it''s'`, `'a\\b'`, `'a\nb'`]);
  } finally {
    await connection.execute('drop table escaped_defaults');
  }
});
