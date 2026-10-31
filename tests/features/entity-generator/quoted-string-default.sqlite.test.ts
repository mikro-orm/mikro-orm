import { MikroORM } from '@mikro-orm/sqlite';
import { EntityGenerator } from '@mikro-orm/entity-generator';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
class Note {
  @PrimaryKey()
  id!: number;

  @Property({ default: "it's" })
  title!: string;

  @Property({ type: 'text', default: "'quoted'" })
  body!: string;

  @Property({ default: 'a\nb' })
  newline!: string;

  @Property({ default: "x\\'y" })
  mixed!: string;
}

test('string defaults containing single quotes round-trip through the entity generator', async () => {
  const orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [Note],
    dbName: ':memory:',
    extensions: [EntityGenerator],
  });
  await orm.schema.create();
  const src = (await orm.entityGenerator.generate()).join('\n');
  expect(src).toContain(`title: string & Opt = 'it\\'s';`);
  expect(src).toContain("body: string & Opt = `'quoted'`;");
  expect(src).toContain('newline: string & Opt = `a\nb`;');
  expect(src).toContain("mixed: string & Opt = 'x\\\\\\'y';");
  expect(src).not.toContain('defaultRaw');
  await orm.close(true);
});
