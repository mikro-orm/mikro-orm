import { Entity, MikroORM, PrimaryKey, Property } from '@mikro-orm/sqlite';

@Entity()
class Author {

  @PrimaryKey()
  id!: number;

  @Property({ unique: true })
  name!: string;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = MikroORM.initSync({
    entities: [Author],
    dbName: ':memory:',
  });
  await orm.schema.createSchema();
});

afterAll(async () => {
  await orm.close(true);
});

test(`GH issue 2973`, async () => {
  for (const i of [1, 2, 3]) {
    for (const name of ['John', 'Bob']) {
      await orm.em.transactional(async em => {
        const foo1 = await em.findOne(Author, { name });

        if (foo1) {
          await em.removeAndFlush(foo1);
        }

        const foo2 = em.create(Author, { name });
        await em.persistAndFlush(foo2);
      });
    }
  }
});
