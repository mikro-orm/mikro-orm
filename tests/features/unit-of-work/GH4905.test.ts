import { Entity, PrimaryKey, Property } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/sqlite';
import { mockLogger } from '../../helpers.js';

@Entity()
class Book {

  @PrimaryKey()
  id!: string;

  @Property()
  title: string;

  constructor(id: string, title: string) {
    this.id = id;
    this.title = title;
  }

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Book],
    dbName: ':memory:',
  });

  await orm.schema.createSchema();
});

afterAll(async () => {
  await orm.close(true);
});

test('entity with known primary key is added to the identity map as early as on persist call (1/2)', async () => {
  const mock = mockLogger(orm);
  const e1 = new Book('abc', 'title: abc');
  const e2 = new Book('def', 'title: def');

  orm.em.persist(e1);
  orm.em.persist(e2);

  orm.em.remove(e1);
  orm.em.remove(orm.em.getReference(Book, 'def'));

  await orm.em.flush();
  expect(mock).not.toHaveBeenCalled();
});

test('entity with known primary key is added to the identity map as early as on persist call (2/2)', async () => {
  const mock = mockLogger(orm);
  const e1 = new Book('abc', 'title: abc');
  orm.em.persist(e1);

  const e2 = await orm.em.findOneOrFail(Book, 'abc');
  orm.em.remove(e2);

  await orm.em.flush();
  expect(mock).not.toHaveBeenCalled();
});
