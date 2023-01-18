import { EntitySchema, MikroORM } from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { v4 } from 'uuid';

class Base {

  id?: string;

}

class A extends Base {

  childrenA?: A;
  type!: string;

}

const BaseSchema = new EntitySchema<Base>({
  class: Base,
  abstract: true,
  properties: {
    id: {
      type: 'string',
      primary: true,
      length: 36,
      onCreate: () => v4(),
    },
  },
});

const ASchema = new EntitySchema<A, Base>({
  class: A,
  extends: 'Base',
  properties: {
    type: {
      length: 16,
      type: 'string',
    },
    childrenA: {
      entity: () => A,
      reference: 'm:1',
      nullable: true,
    },
  },
});

describe('GH issue 560', () => {

  let orm: MikroORM<PostgreSqlDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [ASchema, BaseSchema],
      dbName: `mikro_orm_test_gh_560`,
      driver: PostgreSqlDriver,
      cache: { enabled: false },
    });
    await orm.schema.refreshDatabase();
  });

  afterAll(async () => {
    await orm.close(true);
  });

  test(`GH issue 560`, async () => {
    const children = orm.em.create(A, { type: 'children' });
    const parent = orm.em.create(A, { type: 'parent', childrenA: children });
    orm.em.persist(parent);

    await expect(orm.em.flush()).resolves.not.toThrow();
    orm.em.clear();

    const fetchedParent = await orm.em.findOneOrFail(A, { type: 'parent' }, { populate: true });
    expect(fetchedParent.childrenA).toBeTruthy();
  });
});
