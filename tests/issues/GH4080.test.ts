import { EntitySchema, SimpleLogger } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/sqlite';

abstract class BaseClass {

  id?: number;

}

interface BaseInterface {
  id?: number;
}

class DerivedClass extends BaseClass {

  name?: string;

}

class ImplementingClass implements BaseInterface {

  id?: number;
  name?: string;

}

const BaseClassSchema = new EntitySchema<BaseClass>({
  name: 'BaseClass',
  abstract: true,
  properties: {
    id: { type: Number, primary: true },
  },
});

const BaseInterfaceSchema = new EntitySchema<BaseInterface>({
  name: 'BaseInterface',
  abstract: true,
  properties: {
    id: { type: Number, primary: true },
  },
});

const DerivedClassSchema = new EntitySchema<DerivedClass>({
  class: DerivedClass,
  extends: 'BaseClass',
  properties: {
    name: { type: String },
  },
});

const ImplementingClassSchema = new EntitySchema<ImplementingClass>({
  class: ImplementingClass,
  extends: 'BaseInterface',
  properties: {
    name: { type: String },
  },
});

let orm: MikroORM;

beforeAll(async () => {
  const logger = jest.fn();
  orm = await MikroORM.init({
    entities: [
      BaseClassSchema,
      DerivedClassSchema,
      BaseInterfaceSchema,
      ImplementingClassSchema,
    ],
    dbName: `:memory:`,
    logger: msg => logger(msg),
    loggerFactory: options => new SimpleLogger(options),
    debug: true,
  });
  expect(logger.mock.calls.toString()).not.toMatch('undefined');
  await orm.schema.refreshDatabase();
});

afterAll(() => orm.close(true));

test('4080', async () => {
  orm.em.create(DerivedClassSchema, { name: 'foo' });
  await orm.em.flush();
  orm.em.clear();

  await orm.em.findOneOrFail(DerivedClassSchema, { name: 'foo' });
});
