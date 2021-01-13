import { Entity, PrimaryKey, MikroORM, BaseEntity } from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';

@Entity()
class A {

  @PrimaryKey()
  id!: number;

}

interface A extends BaseEntity<A, 'id'> { }

describe('@Entity decorator result', () => {

  let orm: MikroORM<PostgreSqlDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [A],
      dbName: `mikro_orm_test_baseentity`,
      type: 'postgresql',
    });
    await orm.getSchemaGenerator().ensureDatabase();
    await orm.getSchemaGenerator().dropSchema();
    await orm.getSchemaGenerator().createSchema();
  });

  afterAll(async () => {
    await orm.close(true);
  });

  test(`@Entity actually provides BaseEntity implementation`, async () => {

    const a = orm.em.create<A>(A, {});
    expect(a.toJSON).toBeInstanceOf(Function); // <-- this actually passes

    expect(a.assign).toBeInstanceOf(Function);
    expect(a.init).toBeInstanceOf(Function);
    expect(a.isInitialized).toBeInstanceOf(Function);
    expect(a.populated).toBeInstanceOf(Function);
    expect(a.toJSON).toBeInstanceOf(Function);
    expect(a.toObject).toBeInstanceOf(Function);
    expect(a.toPOJO).toBeInstanceOf(Function);
    expect(a.toReference).toBeInstanceOf(Function);
  });
});
