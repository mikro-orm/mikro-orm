import { EntitySchema, MikroORM, SimpleLogger } from '@mikro-orm/sqlite';

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

const BaseClassSchema = new EntitySchema({
  class: BaseClass,
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

const DerivedClassSchema = new EntitySchema<DerivedClass, BaseClass>({
  class: DerivedClass,
  extends: BaseClassSchema,
  properties: {
    name: { type: String },
  },
});

const ImplementingClassSchema = new EntitySchema<ImplementingClass, BaseInterface>({
  class: ImplementingClass,
  extends: BaseInterfaceSchema,
  properties: {
    name: { type: String },
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [
      BaseClassSchema,
      DerivedClassSchema,
      BaseInterfaceSchema,
      ImplementingClassSchema,
    ],
    dbName: ':memory:',
    loggerFactory: SimpleLogger.create,
  });
  await orm.schema.refresh();
});

afterAll(() => orm.close(true));

test('4080', async () => {
  orm.em.create(DerivedClassSchema, { name: 'foo' });
  await orm.em.flush();
  orm.em.clear();

  await orm.em.findOneOrFail(DerivedClassSchema, { name: 'foo' });
});
