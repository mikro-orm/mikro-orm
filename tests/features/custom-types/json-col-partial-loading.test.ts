import { MikroORM, JsonType } from '@mikro-orm/sqlite';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
class Shape {
  @PrimaryKey()
  id!: number;

  @Property({ type: JsonType })
  geometry!: any;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: ':memory:',
    entities: [Shape],
  });
  await orm.schema.refresh();
  await orm.em.insert(Shape, { id: 1, geometry: { foo: 123 } });
});

afterAll(async () => {
  await orm.close(true);
});

test('queries top level field of a custom type', async () => {
  const shape = await orm.em.findOneOrFail(Shape, 1, { fields: ['geometry'] });
  expect(shape.geometry).toStrictEqual({ foo: 123 });
});

test('queries nested field of a custom type', async () => {
  const shape = await orm.em.findOneOrFail(Shape, 1, { fields: ['geometry.coordinates'] });
  expect(shape.geometry).toStrictEqual({ foo: 123 });
});
