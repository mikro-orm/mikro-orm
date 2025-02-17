import { MikroORM, EntitySchema, ReferenceKind } from '@mikro-orm/sqlite';
import { mockLogger } from '../../helpers.js';

class TestEntity1 {

  id: string;
  customProp: CustomProp;

  private constructor(id: string, customProp: CustomProp) {
    this.id = id;
    this.customProp = customProp;
  }

}

class TestEntity2 {

  id: string;
  customProp: CustomProp;

  private constructor(id: string, customProp: CustomProp) {
    this.id = id;
    this.customProp = customProp;
  }

}

class CustomProp {

  someValue: string;

  private constructor(someValue: string) {
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
  await orm.em.insert(TestEntity1, { id: 'abc', customProp: { someValue: 'yyy' } });
  await orm.em.insert(TestEntity2, { id: 'def', customProp: { someValue: 'xxx' } });

  const mock = mockLogger(orm);

  await orm.em.findOne(TestEntity1, 'abc');
  await orm.em.findOne(TestEntity1, 'abc'); // should not trigger SQL query

  await orm.em.findOne(TestEntity2, 'def');
  await orm.em.findOne(TestEntity2, 'def'); // should not trigger SQL query

  expect(mock).toHaveBeenCalledTimes(2);
});
