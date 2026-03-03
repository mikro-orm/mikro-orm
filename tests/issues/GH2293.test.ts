import { MikroORM, t } from '@mikro-orm/sqlite';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
export class TestEntity {
  @PrimaryKey()
  id!: number;

  @Property({ type: t.json })
  jsonField: { name: string }[] = [{ name: 'hello' }];
}

describe('GH issue 2293', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [TestEntity],
      dbName: ':memory:',
    });
    await orm.schema.refresh();
  });

  afterAll(() => orm.close(true));

  test('cascade persist with pre-filled PK and with cycles', async () => {
    const a = new TestEntity();
    await orm.em.fork().persist(a).flush();
    const a1 = await orm.em.findOneOrFail(TestEntity, a.id);
    expect(a1.id).toBeDefined();
    expect(a1.jsonField).toEqual([{ name: 'hello' }]);

    await orm.em.persist([new TestEntity(), new TestEntity(), new TestEntity()]).flush();
    orm.em.clear();

    const as = await orm.em.find(TestEntity, {});
    expect(as.map(a => a.jsonField)).toEqual([
      [{ name: 'hello' }],
      [{ name: 'hello' }],
      [{ name: 'hello' }],
      [{ name: 'hello' }],
    ]);
  });
});
