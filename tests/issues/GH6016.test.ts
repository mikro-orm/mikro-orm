import { Collection, MikroORM, OptionalProps } from '@mikro-orm/sqlite';
import { Entity, ManyToOne, OneToMany, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
class TestCase {

  [OptionalProps]?: 'version';

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Property({ version: true })
  version!: number;

  @OneToMany(() => TestCaseRevision, 'testCase')
  revisions = new Collection<TestCaseRevision>(this);

}

@Entity()
class TestCaseRevision {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Property() // Regular field
  version!: number;

  @ManyToOne(() => TestCase)
  testCase!: TestCase;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: ':memory:',
    entities: [TestCase, TestCaseRevision],
  });

  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

it('test', async () => {
  await orm.em.insertMany(TestCase, [
    { name: 'a', version: 10 }, // id 1
    { name: 'b', version: 100 }, // id 2
    { name: 'c', version: 1 }, // id 3
  ]);

  await orm.em.insertMany(TestCaseRevision, [
    { testCase: 3, name: 'c', version: 1 },
    { testCase: 1, name: 'a', version: 10 },
    { testCase: 2, name: 'b', version: 100 },
  ]);

  const revisions = await orm.em.findAll(TestCaseRevision, {
    populate: ['testCase'],
  });

  const testCases = revisions.map(it => it.testCase);

  expect(testCases).toMatchObject([
    { name: 'c', version: 1, id: 3 },
    { name: 'a', version: 10, id: 1 },
    { name: 'b', version: 100, id: 2 },
  ]);

  testCases[0].name = 'c0';
  testCases[1].name = 'a0';
  testCases[2].name = 'b0';

  await orm.em.flush();

  // Correct result
  expect(testCases).toMatchObject([
    { name: 'c0', version: 2, id: 3 },
    { name: 'a0', version: 11, id: 1 },
    { name: 'b0', version: 101, id: 2 },
  ]);
});
