import { Collection, Entity, ManyToOne, OneToMany, MikroORM, PrimaryKey, Property } from '@mikro-orm/core';
import { BetterSqliteDriver } from '@mikro-orm/better-sqlite';

@Entity()
class TestRunEntity {

  @PrimaryKey()
  id!: number;

  @OneToMany(() => TestCaseEntity, e => e.testRun)
  cases = new Collection<TestCaseEntity>(this);

}

@Entity()
class TestCaseEntity {

  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

  @ManyToOne(() => TestRunEntity)
  testRun!: TestRunEntity;

}

let orm: MikroORM<BetterSqliteDriver>;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [TestCaseEntity],
    dbName: ':memory:',
    driver: BetterSqliteDriver,
  });
  await orm.schema.createSchema();
});

afterAll(() => orm.close(true));

// should run around 50-100ms
test('perf: create large 1:m collection', async () => {
  console.time('perf: create large 1:m collection (10k entities)');
  const entity = orm.em.create(TestRunEntity, {
    cases: Array(10_000).fill(undefined).map((_, index) => ({
      title: `Test Case #${index}`,
    })),
  });
  console.timeEnd('perf: create large 1:m collection (10k entities)');
});
