import { Entity, IdentifiedReference, MikroORM, OneToOne, PrimaryKey, Property, wrap, Reference, EntityManager } from '@mikro-orm/core';
import { SchemaGenerator, SqliteDriver } from '@mikro-orm/sqlite';
import { create } from 'domain';

@Entity()
export class A {

  @PrimaryKey({ type: 'number' })
  id!: number;

  @Property()
  name!: string;

}

describe('GH issue 1910', () => {

  let orm: MikroORM<SqliteDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [A],
      dbName: 'file:memDb1?mode=memory&cache=shared',
      type: 'sqlite',
      autoJoinOneToOneOwner: false,
    });
    await new SchemaGenerator(orm.em).dropSchema();
    await new SchemaGenerator(orm.em).createSchema();
  });

  afterAll(() => orm.close(true));

  test('nested transaction test', async () => {
    const rootEm = orm.em.fork();

    async function createA(em: EntityManager, id: number) {
      const a = new A();
      a.id = id;
      a.name = 'my name is a';
      await em.persistAndFlush(a);
    }

    const [id1, id2, id3, id4] = await rootEm.transactional(async em => {
      await createA(em, 1);

      await rootEm.transactional(async em => {
        await createA(em, 2);
      });

      await rootEm.transactional(async em => {
        await createA(em, 3);
        await em.rollback();
      });

      await rootEm.transactional(async em => {
        await createA(em, 4);
      });

      await rootEm.rollback();

      return [1, 2, 3, 4];
    });

    expect(await rootEm.findOne(A, id1)).toBeNull();
    expect(await rootEm.findOne(A, id2)).not.toBeNull();
    expect(await rootEm.findOne(A, id3)).toBeNull();
    expect(await rootEm.findOne(A, id4)).not.toBeNull();
  });

  test('transaction test', async () => {
    const rootEm = orm.em.fork();

    async function createA(em: EntityManager, id: number) {
      const a = new A();
      a.id = id;
      a.name = 'my name is a';
      await em.persistAndFlush(a);
    }

    await rootEm.transactional(async em => {
      await createA(em, 2);
    });

    expect(await rootEm.findOne(A, 2)).not.toBeNull();
  });

});
