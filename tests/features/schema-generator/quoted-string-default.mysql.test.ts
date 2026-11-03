import { MikroORM, type Opt } from '@mikro-orm/mysql';
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

  @Property({ default: 'a\nb' })
  newline!: string & Opt;

  @Property({ default: "x\\'y" })
  mixed!: string & Opt;

  @Property({ default: 'say "hi"' })
  quote!: string & Opt;

  @Property({ type: 'text', default: 'say "hi"' })
  text!: string & Opt;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [Note],
    dbName: 'mikro_orm_test_quoted_default',
    port: 3308,
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
  expect(loaded.path).toBe('a\\b');
  expect(loaded.note).toBe('a\\b');
  expect(loaded.newline).toBe('a\nb');
  expect(loaded.mixed).toBe("x\\'y");
});
