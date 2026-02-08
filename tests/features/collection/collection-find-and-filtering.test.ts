import { Entity, ManyToOne, OneToMany, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { Collection, MikroORM, type Ref } from '@mikro-orm/sqlite';

@Entity({
  discriminatorColumn: 'type',
  discriminatorMap: {
    json: 'JSONFile',
    markdown: 'MarkdownFile',
  },
})
class SavedFile {

  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Directory)
  directory!: Ref<Directory>;

}

@Entity({
  discriminatorValue: 'json',
})
class JSONFile extends SavedFile {

  @Property()
  extension = '.json';

}

@Entity({
  discriminatorValue: 'markdown',
})
class MarkdownFile extends SavedFile {

  @Property()
  extension = '.md';

}

@Entity()
class Directory {

  @PrimaryKey()
  id!: number;

  @OneToMany(() => SavedFile, file => file.directory)
  files = new Collection<SavedFile>(this);

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [Directory, SavedFile, JSONFile, MarkdownFile],
    dbName: ':memory:',
  });

  await orm.schema.refresh();
});

afterAll(async () => {
  await orm.close(true);
});

test('filtering a collection returns the expected items', () => {
  const directory = new Directory();

  const jsonFile = new JSONFile();

  directory.files.add(jsonFile);
  directory.files.add(new MarkdownFile());

  const filtered = directory.files.filter(item => item instanceof JSONFile);

  expect(filtered).toStrictEqual([jsonFile]);
  expectTypeOf(filtered).toEqualTypeOf<JSONFile[]>();
});

test('finding an item in a collection returns the expected item', () => {
  const directory = new Directory();

  const jsonFile = new JSONFile();

  directory.files.add(jsonFile);
  directory.files.add(new MarkdownFile());

  const result = directory.files.find(item => item instanceof JSONFile);

  expect(result).toStrictEqual(jsonFile);
  expectTypeOf(result).toEqualTypeOf<JSONFile | undefined>();
});
