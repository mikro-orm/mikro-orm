import { EntitySchema, MikroORM } from '@mikro-orm/sqlite';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
class TestCase {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: ':memory:',
    entities: [TestCase],
  });

  await orm.schema.refresh();
});

afterAll(async () => {
  await orm.close(true);
});

test('dynamic entities', async () => {
  for (let i = 0; i < 10; i++) {
    const schema = new EntitySchema({
      name: `DynamicEntity${i}`,
      properties: {
        id: { type: 'number', primary: true },
        foo: { type: 'string' },
        bar: { type: 'string', nullable: true },
      },
    });
    orm.discoverEntity(schema);
    const meta = orm.getMetadata(schema.name);
    expect(meta).toBe(meta.root);
    await orm.schema.update();

    const entity = orm.em.create(schema.name, {
      foo: `Foo ${Math.random()}`,
      bar: `Foo ${Math.random()}`,
    });
    await orm.em.flush();
    expect(entity).toBeInstanceOf(meta.class);
  }
});
