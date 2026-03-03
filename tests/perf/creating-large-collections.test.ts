import { Collection, MikroORM, OptionalProps } from '@mikro-orm/sqlite';
import {
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryKey,
  Property,
  ReflectMetadataProvider,
} from '@mikro-orm/decorators/legacy';

@Entity()
class TestRunEntity {
  @PrimaryKey()
  id!: number;

  @OneToMany(() => TestCaseEntity, e => e.testRun)
  cases = new Collection<TestCaseEntity>(this);
}

@Entity()
class TestCaseEntity {
  [OptionalProps]?: 'testRun';

  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

  @ManyToOne(() => TestRunEntity)
  testRun!: TestRunEntity;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [TestCaseEntity],
    dbName: ':memory:',
    flushMode: 'commit',
  });
  await orm.schema.create();
});

afterAll(() => orm.close(true));

// should run around 50-100ms
test('perf: create large 1:m collection', async () => {
  console.time('perf: create large 1:m collection (10k entities)');
  const entity = orm.em.create(TestRunEntity, {
    cases: Array(10_000)
      .fill(undefined)
      .map((_, index) => ({
        title: `Test Case #${index}`,
      })),
  });
  console.timeEnd('perf: create large 1:m collection (10k entities)');
});
