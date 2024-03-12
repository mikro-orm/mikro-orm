import { MikroORM, Entity, Enum, PrimaryKey, Opt } from '@mikro-orm/postgresql';
import { mockLogger } from '../../helpers';

enum MyEnum {
  LOCAL = 'local',
  GLOBAL = 'global',
}

@Entity()
class EnumEntity {

  @PrimaryKey()
  id!: number;

  @Enum({ items: () => MyEnum, nativeEnumName: 'my_enum' })
  type: Opt<MyEnum> = MyEnum.LOCAL;

  @Enum({ items: () => MyEnum, nativeEnumName: 'my_enum', array: true })
  types: MyEnum[] = [];

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [EnumEntity],
    dbName: '5322',
  });

  await orm.schema.ensureDatabase();
  await orm.schema.execute(`drop type if exists my_enum cascade`);
  await orm.schema.execute(`drop table if exists enum_entity`);
});

afterAll(() => orm.close());

test('GH #5322', async () => {
  const sql = await orm.schema.getCreateSchemaSQL();
  const freshUpdate = await orm.schema.getUpdateSchemaSQL();
  expect(sql).toMatch(`create type "my_enum" as enum ('local', 'global');\ncreate table "enum_entity" ("id" serial primary key, "type" "my_enum" not null default 'local', "types" "my_enum"[] not null);`);
  expect(freshUpdate).toMatch(`create type "my_enum" as enum ('local', 'global');\ncreate table "enum_entity" ("id" serial primary key, "type" "my_enum" not null default 'local', "types" "my_enum"[] not null);`);
  await orm.schema.execute(sql);

  const meta = orm.getMetadata(EnumEntity);
  meta.properties.type.items = ['foo'];
  meta.properties.types.items = ['foo'];
  const diff = await orm.schema.getUpdateSchemaSQL();
  expect(diff).toMatch(`alter type "my_enum" add value if not exists 'foo';`);
  await orm.schema.execute(diff);

  const mock = mockLogger(orm);
  const foo = orm.em.create(EnumEntity, { types: [MyEnum.GLOBAL] });
  await orm.em.flush();
  orm.em.clear();

  const foo2 = await orm.em.findOneOrFail(EnumEntity, foo);
  expect(foo2.types).toEqual([MyEnum.GLOBAL]);
  foo2.types.push(MyEnum.LOCAL);
  await orm.em.flush();
  orm.em.clear();

  const foo3 = await orm.em.findOneOrFail(EnumEntity, foo);
  expect(foo3.types).toEqual([MyEnum.GLOBAL, MyEnum.LOCAL]);

  expect(mock.mock.calls[0][0]).toMatch(`begin`);
  expect(mock.mock.calls[1][0]).toMatch(`insert into "enum_entity" ("type", "types") values ('local', '{global}') returning "id"`);
  expect(mock.mock.calls[2][0]).toMatch(`commit`);
  expect(mock.mock.calls[3][0]).toMatch(`select "e0".* from "enum_entity" as "e0" where "e0"."id" = 1 limit 1`);
  expect(mock.mock.calls[4][0]).toMatch(`begin`);
  expect(mock.mock.calls[5][0]).toMatch(`update "enum_entity" set "types" = '{global,local}' where "id" = 1`);
  expect(mock.mock.calls[6][0]).toMatch(`commit`);
  expect(mock.mock.calls[7][0]).toMatch(`select "e0".* from "enum_entity" as "e0" where "e0"."id" = 1 limit 1`);
});
