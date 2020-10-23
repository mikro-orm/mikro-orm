import { Entity, PrimaryKey, MikroORM } from '@mikro-orm/core';

@Entity()
class A {

  @PrimaryKey()
  id!: number;

}


describe('GH issue 947', () => {

  test(`transactional works with a single postgres connection`, async () => {
    const orm = await MikroORM.init({
      entities: [A],
      dbName: `mikro_orm_test_gh_947`,
      type: 'postgresql',
      pool: {
        min: 1,
        max: 1,
      },
    });
    await orm.getSchemaGenerator().ensureDatabase();
    await orm.getSchemaGenerator().dropSchema();
    await orm.getSchemaGenerator().createSchema();

    await orm.em.transactional(async transactionalEm => {
      // Comment this line out and the test will pass.
      await transactionalEm.getConnection().execute(`SET TRANSACTION ISOLATION LEVEL SERIALIZABLE`);
      await transactionalEm.persistAndFlush(new A());
    });

    await orm.close();

  });

});
