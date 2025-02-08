import { Entity, EntityManager, MikroORM, PrimaryKey, Property } from '@mikro-orm/postgresql';

@Entity()
class A {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

}

describe('GH issue 1910', () => {

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [A],
      dbName: 'mikro_orm_test_gh_1910',
    });
    await orm.schema.refreshDatabase();
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

    await expect(em.fork().findOne(A, id1)).resolves.toBeNull();
    await expect(em.fork().findOne(A, id2)).resolves.not.toBeNull();
    await expect(em.fork().findOne(A, id3)).resolves.toBeNull();
    await expect(em.fork().findOne(A, id4)).resolves.not.toBeNull();
  });

});
