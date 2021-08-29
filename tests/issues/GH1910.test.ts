import type { EntityManager } from '@mikro-orm/core';
import { Entity, MikroORM, PrimaryKey, Property } from '@mikro-orm/core';
import type { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { SchemaGenerator } from '@mikro-orm/postgresql';

@Entity()
export class A {

  @PrimaryKey({ type: 'number' })
  id!: number;

  @Property()
  name!: string;

}

describe('GH issue 1910', () => {

  let orm: MikroORM<PostgreSqlDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [A],
      dbName: 'mikro_orm_test_gh_1910',
      type: 'postgresql',
    });
    await new SchemaGenerator(orm.em).ensureDatabase();
    await new SchemaGenerator(orm.em).dropSchema();
    await new SchemaGenerator(orm.em).createSchema();
  });

  afterAll(() => orm.close(true));

  test('nested transaction test', async () => {
    const em = orm.em.fork();

    async function createA(em: EntityManager, id: number) {
      const a = new A();
      a.id = id;
      a.name = 'my name is a';
      await em.persistAndFlush(a);
    }

    const [id1, id2, id3, id4] = await em.transactional(async em => {
      await createA(em, 1);

      await em.fork().transactional(async em => {
        await createA(em, 2);
      });

      await em.fork().transactional(async em => {
        await createA(em, 3);
        await em.rollback();
      });

      await em.fork().transactional(async em => {
        await createA(em, 4);
      });

      await em.rollback();

      return [1, 2, 3, 4];
    });

    expect(await em.findOne(A, id1)).toBeNull();
    expect(await em.findOne(A, id2)).not.toBeNull();
    expect(await em.findOne(A, id3)).toBeNull();
    expect(await em.findOne(A, id4)).not.toBeNull();
  });

});
