import { Entity, MikroORM, PrimaryKey, Property } from '@mikro-orm/core';
import { SqliteDriver } from '@mikro-orm/sqlite';

@Entity({ tableName: 'AAA' })
export class A {

  @PrimaryKey()
  id!: string;

  @Property()
  name!: string;

}

@Entity({ tableName: 'AAA' })
export class B {

  @PrimaryKey()
  id!: string;

  @Property()
  name!: string;

}

describe('GH issue 2067', () => {
  let orm1: MikroORM<SqliteDriver>;
  let orm2: MikroORM<SqliteDriver>;

  beforeAll(async () => {
    orm1 = await MikroORM.init({
      entities: [A],
      dbName: 'mikro_orm_test_gh_2067-1',
      type: 'sqlite',
    });
    await orm1.getSchemaGenerator().createSchema();
    orm2 = await MikroORM.init({
      entities: [B],
      dbName: 'mikro_orm_test_gh_2067-2',
      type: 'sqlite',
    });
    await orm2.getSchemaGenerator().createSchema();
  });

  afterAll(() => {
    orm1.close(true);
    orm2.close(true);
  });

  test('GH issue 2067', async () => {

    await orm1.em.clear();
    await orm2.em.clear();

    let a2: A;

    await orm1.em.transactional(async () => {
      await orm2.em.transactional(async () => {
        a2 = orm1.em.create(A, { id: '1', name: 'Z' });
      });
    });
    expect(a2!.id).toBe('1');
  });

});
