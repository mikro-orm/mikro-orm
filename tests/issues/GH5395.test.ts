import { Entity, MikroORM, PrimaryKey, Property } from '@mikro-orm/sqlite';

@Entity()
class Post {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Post],
    dbName: ':memory:',
  });
  await orm.schema.createSchema();
});

afterAll(() => orm.close(true));

test('em.getRepository() and context resolution (GH #5395)', async () => {
  const em = orm.em.fork({ useContext: true });
  await em.transactional(async _ => {
    // this could happen in a nested service without access to tx-specific EM
    await em.getRepository(Post).find({ id: 1 });
  });
  await em.getRepository(Post).find({ id: 1 });

  await em.getRepository(Post).getEntityManager().getContext().find(Post, { id: 1 });
  expect(em.id).toBe(em.getRepository(Post).getEntityManager().id);
});
