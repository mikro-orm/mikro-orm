import { Entity, MikroORM, PrimaryKey, Property, Embeddable, Embedded, PrimaryKeyProp, Opt } from '@mikro-orm/sqlite';
import { mockLogger } from '../helpers.js';

@Embeddable()
class StepEntity {

  @Property()
  camelCasePropertyName!: number;

}

@Entity({ tableName: 'test_case' })
class TestCaseEntity {

  [PrimaryKeyProp]?: 'sid';

  @PrimaryKey({ autoincrement: true })
  sid!: number;

  @Embedded(() => StepEntity, { object: true, nullable: true })
  step?: StepEntity;

  @Embedded(() => StepEntity, { array: true })
  steps: StepEntity[] & Opt = [];

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [TestCaseEntity],
  });
  await orm.schema.createSchema();
});

afterAll(async () => {
  await orm.close(true);
});

test('extra updates on embedded arrays', async () => {
  const testCase = orm.em.getRepository(TestCaseEntity).create({
    step: { camelCasePropertyName: 2 },
    steps: [{ camelCasePropertyName: 1 }],
  });

  await orm.em.persistAndFlush(testCase);

  const mock = mockLogger(orm);
  await orm.em.flush();
  expect(mock).not.toHaveBeenCalled();
});
