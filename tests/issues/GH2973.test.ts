import { MikroORM } from '@mikro-orm/sqlite';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
class Author {

  @PrimaryKey()
  id!: number;

  @Property({ unique: true })
  name!: string;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = new MikroORM({
    metadataProvider: ReflectMetadataProvider,
    entities: [Author],
    dbName: ':memory:',
  });
  await orm.schema.create();
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
          await em.remove(foo1).flush();
        }

        const foo2 = em.create(Author, { name });
        await em.persist(foo2).flush();
      });
    }
  }
});
