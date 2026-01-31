import { Entity, ManyToOne, OneToMany, PrimaryKey, Property, ReflectMetadataProvider } from "@mikro-orm/decorators/legacy";
import { Collection, MikroORM, type Ref } from "@mikro-orm/sqlite";

@Entity()
class SavedFile {

  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Directory)
  directory!: Ref<Directory>;

}

@Entity()
class JSONFile extends SavedFile {

  @Property()
  jsonContent!: string;

}

@Entity()
class MarkdownFile extends SavedFile {

  @Property()
  markdownContent!: string;

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
    dbName: `collection-filtering`,
  });

  await orm.schema.refresh();
});

afterAll(async () => {
  await orm.close(true);
});

test('filtering a collection narrows the output type', () => {
  const directory = new Directory();

  directory.files.add(new JSONFile());
  directory.files.add(new MarkdownFile());

  const filtered = directory.files.filter(item => item instanceof JSONFile);

  expectTypeOf(filtered).toEqualTypeOf<JSONFile[]>();
});
