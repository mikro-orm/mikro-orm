import { MikroORM } from '@mikro-orm/sqlite';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { mockLogger } from '../../helpers.js';

@Entity()
class Book {
  @PrimaryKey()
  id!: number;

  @Property()
  title: string;

  constructor(title: string) {
    this.title = title;
  }
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [Book],
    forceEntityConstructor: true,
    dbName: ':memory:',
  });

  await orm.schema.create();
});

afterAll(async () => {
  await orm.close(true);
});

test('4426', async () => {
  await orm.em.fork().persist(new Book('test book')).flush();
  const b = await orm.em.findOneOrFail(Book, { id: 1 });

  const mock = mockLogger(orm);
  await orm.em.flush();
  expect(mock).not.toHaveBeenCalled();
});
