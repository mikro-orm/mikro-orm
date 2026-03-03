import { MikroORM } from '@mikro-orm/mysql';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider, Unique } from '@mikro-orm/decorators/legacy';

@Entity()
@Unique({ properties: ['uniq1', 'uniq2'] })
class MyEntity1 {
  @PrimaryKey()
  id?: number;

  @Property()
  uniq1!: number;

  @Property()
  uniq2!: number;

  @Property()
  name!: string;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: 'mikro_4692',
    port: 3308,
    entities: [MyEntity1],
  });
  await orm.schema.refresh();
});

afterAll(() => orm.close(true));
beforeEach(() => orm.schema.clear());

test('4692 1/2', async () => {
  const entities = [
    orm.em.create(MyEntity1, { id: 1, uniq1: 1, uniq2: 1, name: 'first' }),
    orm.em.create(MyEntity1, { id: 2, uniq1: 2, uniq2: 1, name: 'second' }),
  ];
  await orm.em.insertMany(entities);

  const res = await orm.em.find(MyEntity1, {});
  expect(res).toHaveLength(2);
});

test('4692 2/2', async () => {
  const entity = orm.em.create(MyEntity1, { id: 3, uniq1: 3, uniq2: 3, name: 'third' });
  await orm.em.insert(entity);

  const res = await orm.em.find(MyEntity1, {});
  expect(res).toHaveLength(1);
});
