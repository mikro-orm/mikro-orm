import { Entity, PrimaryKey, Property } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/sqlite';
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
    entities: [Book],
    forceEntityConstructor: true,
    dbName: ':memory:',
  });

  await orm.schema.createSchema();
});

afterAll(async () => {
  await orm.close(true);
});

test('4426', async () => {
  await orm.em.fork().persistAndFlush(new Book('test book'));
  const b = await orm.em.findOneOrFail(Book, { id: 1 });

  const mock = mockLogger(orm);
  await orm.em.flush();
  expect(mock).not.toHaveBeenCalled();
});
