import { MikroORM, EntitySchema, ReferenceKind } from '@mikro-orm/sqlite';
import { mockLogger } from '../../helpers';

class TestEntity1 {

  id: string;
  customProp: CustomProp;

  constructor(id: string, customProp: CustomProp) {
    this.id = id;
    this.customProp = customProp;
  }

}

class TestEntity2 {

  id: string;
  customProp: CustomProp;

  constructor(id: string, customProp: CustomProp) {
    this.id = id;
    this.customProp = customProp;
  }

}

class CustomProp {

  someValue: string;

  constructor(someValue: string) {
    this.someValue = someValue;
  }

}

const TestEntity1Schema = new EntitySchema({
  class: TestEntity1,
  properties: {
    id: {
      type: 'text',
      primary: true,
    },
    customProp: {
      type: 'CustomProp',
      kind: ReferenceKind.EMBEDDED,
      object: true,
    },
  },
});

const TestEntity2Schema = new EntitySchema({
  class: TestEntity2,
  properties: {
    id: {
      type: 'text',
      primary: true,
    },
    customProp: {
      type: 'CustomProp',
      kind: ReferenceKind.EMBEDDED,
      object: false,
    },
  },
});

const CustomPropSchema = new EntitySchema({
  class: CustomProp,
  embeddable: true,
  properties: {
    someValue: {
      type: 'text',
    },
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [TestEntity1Schema, TestEntity2Schema, CustomPropSchema],
    dbName: `:memory:`,
  });

  await orm.schema.createSchema();
});

afterAll(() => orm.close(true));

test('preserve data fields that match pivot field', async () => {
  const e1 = new TestEntity1('abc', new CustomProp('yyy'));
  await orm.em.insert(TestEntity1, e1);

  const e2 = new TestEntity2('def', new CustomProp('xxx'));
  await orm.em.insert(TestEntity2, e2);

  const mock = mockLogger(orm);

  await orm.em.findOne(TestEntity1, 'abc');
  await orm.em.findOne(TestEntity1, 'abc'); // should not trigger SQL query

  await orm.em.findOne(TestEntity2, 'def');
  await orm.em.findOne(TestEntity2, 'def'); // should not trigger SQL query

  expect(mock).toHaveBeenCalledTimes(2);
});
