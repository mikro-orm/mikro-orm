import { JsonType, MikroORM, Opt } from '@mikro-orm/postgresql';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
class TestJsonEntity {
  @PrimaryKey()
  id!: number;

  @Property({
    type: JsonType,
    defaultRaw: `'[]'`,
    columnType: 'json',
  })
  jsonArray: string[] & Opt = [];

  @Property({
    type: JsonType,
    nullable: true,
    columnType: 'json',
  })
  jsonObj!: { foo: number; bar: string } & Opt;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: '5936',
    entities: [TestJsonEntity],
  });
  await orm.schema.refresh();
});

afterAll(async () => {
  await orm.close(true);
});

test('test json field parse', async () => {
  orm.em.create(TestJsonEntity, { jsonArray: ['foo', 'bar'], jsonObj: { foo: 2, bar: 'abc' } });
  await orm.em.flush();
  orm.em.clear();

  const testEntityInstances = await orm.em.findAll(TestJsonEntity);
  expect(testEntityInstances).toEqual([
    {
      id: 1,
      jsonArray: ['foo', 'bar'],
      jsonObj: { bar: 'abc', foo: 2 },
    },
  ]);
});
