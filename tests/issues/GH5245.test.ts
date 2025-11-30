import { MikroORM, Ref } from '@mikro-orm/sqlite';
import { Entity, OneToOne, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
class Test {

  @PrimaryKey()
  id!: number;

  @OneToOne(() => TestRelation, tr => tr.test, { ref: true, nullable: true })
  relation?: Ref<TestRelation>;

}

@Entity()
class TestRelation {

  @PrimaryKey()
  id!: number;

  @OneToOne(() => Test, t => t.relation, { ref: true, owner: true })
  test!: Ref<Test>;

  @Property()
  name!: string;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [Test, TestRelation],
    dbName: ':memory:',
  });

  await orm.schema.createSchema();

  const testInstance = orm.em.create(Test, {});
  orm.em.create(TestRelation, {
    test: testInstance,
    name: 'test',
  });
  await orm.em.flush();
});

afterAll(async () => {
  await orm.close(true);
});

test('test with QB', async () => {
  const forkedEm = orm.em.fork();
  const x = await forkedEm.createQueryBuilder(Test, 't').select(['id']).getResultList();

  expect(x.length).toBe(1);
  expect(x[0].id).toBe(1);

  // If run with refresh it normally loads
  const normallyLoaded = await forkedEm.findOneOrFail(Test, { id: 1 }, { populate: ['relation'] });
  expect(normallyLoaded.relation?.$.name).toBeDefined();
  expect(normallyLoaded.relation?.$.name).toBe('test');
});

test('test with em', async () => {
  const forkedEm = orm.em.fork();
  const x = await forkedEm.find(Test, {}, { fields: ['id'] });

  expect(x.length).toBe(1);
  expect(x[0].id).toBe(1);

  // If run with refresh it normally loads
  const normallyLoaded = await forkedEm.findOneOrFail(Test, { id: 1 }, { populate: ['relation'] });
  expect(normallyLoaded.relation?.$.name).toBeDefined();
  expect(normallyLoaded.relation?.$.name).toBe('test');
});

test('otherwise loaded can be defined', async () => {
  const normallyLoaded = await orm.em.fork().findOneOrFail(Test, { id: 1 }, { populate: ['relation'] });
  expect(normallyLoaded.relation?.$.name).toBeDefined();
  expect(normallyLoaded.relation?.$.name).toBe('test');
});
