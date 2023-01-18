import { Entity, PrimaryKey, Property } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/mongodb';

@Entity()
export class Author {

  @PrimaryKey({ name: '_id' })
  id: string = '' + Math.random();

  @Property()
  termsAccepted: boolean = false;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Author],
    clientUrl: 'mongodb://localhost:27017/mikro-orm-3897',
  });
  await orm.schema.clearDatabase();
});

afterAll(() => orm.close(true));

test('GH issue 3897', async () => {
  const author = new Author();
  const author2 = new Author();
  await orm.em.persist([author, author2]).flush();

  author.termsAccepted = true;
  author2.termsAccepted = true;
  await orm.em.flush();

  const r1 = await orm.em.fork().find(Author, {});
  expect(r1[0].termsAccepted).toBe(true);
  expect(r1[1].termsAccepted).toBe(true);
});
