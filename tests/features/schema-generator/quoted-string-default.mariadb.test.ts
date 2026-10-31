import { DatabaseSchema, MikroORM, type Opt } from '@mikro-orm/mariadb';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
class Note {
  @PrimaryKey()
  id!: number;

  @Property({ default: "it's" })
  title!: string & Opt;

  @Property({ type: 'text', default: "'quoted'" })
  body!: string & Opt;

  @Property({ default: 'a\\b' })
  path!: string & Opt;

  @Property({ type: 'text', default: 'a\\b' })
  note!: string & Opt;

  @Property({ default: 'say "hi"' })
  quote!: string & Opt;

  @Property({ type: 'text', default: 'say "hi"' })
  text!: string & Opt;

  @Property({ type: 'json', default: '{"a":1}' })
  meta!: object & Opt;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [Note],
    dbName: 'mikro_orm_test_quoted_default',
    port: 3309,
  });
  await orm.schema.refresh();
});

afterAll(() => orm.close(true));

test('string defaults containing single quotes are escaped', async () => {
  const diff = await orm.schema.getUpdateSchemaMigrationSQL({ wrap: false });
  expect(diff).toEqual({ up: '', down: '' });

  const note = orm.em.create(Note, {});
  await orm.em.flush();
  orm.em.clear();
  const loaded = await orm.em.findOneOrFail(Note, note.id);
  expect(loaded.title).toBe("it's");
  expect(loaded.body).toBe("'quoted'");
});

test('varchar and text literals are introspected in the same form', async () => {
  const connection = orm.em.getConnection();
  await connection.execute(
    "create table escaped_defaults (id int primary key, tq text default ('a\\\\''b'), vq varchar(10) default ('a\\\\''b'), tn text default ('a\\nb'), vn varchar(10) default ('a\\nb'))",
  );

  try {
    const schema = await DatabaseSchema.create(connection, orm.em.getPlatform(), orm.config);
    const defaults = schema
      .getTable('escaped_defaults')!
      .getColumns()
      .map(col => col.default);
    expect(defaults).toEqual([null, `'a\\\\''b'`, `'a\\\\''b'`, `'a\\nb'`, `'a\\nb'`]);
  } finally {
    await connection.execute('drop table escaped_defaults');
  }
});
