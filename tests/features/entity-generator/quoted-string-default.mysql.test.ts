import { MikroORM } from '@mikro-orm/mysql';
import { EntityGenerator } from '@mikro-orm/entity-generator';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
class Note {
  @PrimaryKey()
  id!: number;

  @Property({ default: "it's" })
  title!: string;

  // text defaults come back with a charset introducer and backslash escaping, unlike varchar ones
  @Property({ type: 'text', default: "'quoted'" })
  body!: string;

  @Property({ default: 'a\\b' })
  path!: string;

  @Property({ default: 'a\nb' })
  newline!: string;
}

test('string defaults containing single quotes round-trip through the entity generator', async () => {
  const orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [Note],
    dbName: 'mikro_orm_test_quoted_default_eg',
    port: 3308,
    extensions: [EntityGenerator],
  });
  await orm.schema.refresh();
  const src = (await orm.entityGenerator.generate()).join('\n');
  expect(src).toContain(`title: string & Opt = 'it\\'s';`);
  expect(src).toContain("body: string & Opt = `'quoted'`;");
  expect(src).toContain("path: string & Opt = 'a\\\\b';");
  expect(src).toContain('newline: string & Opt = `a\nb`;');
  expect(src).not.toContain('defaultRaw');
  await orm.close(true);
});
