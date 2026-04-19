import { MikroORM } from '@mikro-orm/postgresql';
import { Entity, Enum, PrimaryKey, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

enum MyEnum {
  LOCAL = 'local',
  GLOBAL = 'global',
}

@Entity()
class EnumEntity {
  @PrimaryKey()
  id!: number;

  @Enum({ items: () => MyEnum, nativeEnumName: 'my_enum', array: true })
  types: MyEnum[] = [];
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [EnumEntity],
    dbName: '7560',
  });

  await orm.schema.ensureDatabase();
  await orm.schema.execute(`drop type if exists my_enum cascade`);
  await orm.schema.execute(`drop table if exists enum_entity`);
});

afterAll(() => orm.close());

test('GH #7560 — adding new native enum value on array column generates migration', async () => {
  await orm.schema.execute(await orm.schema.getCreateSchemaSQL());

  const meta = orm.getMetadata(EnumEntity);
  meta.properties.types.items = ['local', 'global', 'archived'];

  const diff = await orm.schema.getUpdateSchemaSQL();
  expect(diff).toMatch(`alter type "my_enum" add value if not exists 'archived' after 'global';`);
});
