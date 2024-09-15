import { Entity, EntitySchema, MikroORM, PrimaryKey, Property } from '@mikro-orm/sqlite';

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
    dbName: ':memory:',
    entities: [TestCase],
  });

  await orm.schema.refreshDatabase();
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
    await orm.schema.updateSchema();

    const entity = orm.em.create(schema.name, {
      foo: `Foo ${Math.random()}`,
      bar: `Foo ${Math.random()}`,
    });
    await orm.em.flush();
    expect(entity).toBeInstanceOf(meta.class);
  }
});
