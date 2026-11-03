import { defineEntity, p } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/sqlite';
import { mockLogger } from '../helpers.js';

const Author = defineEntity({
  name: 'Author',
  properties: {
    id: p.integer().primary(),
    // property `name` is stored in column `default_name` ...
    name: p.string().fieldName('default_name'),
    // ... while column `name` belongs to another property
    nameJson: p.string().fieldName('name'),
    descriptionJson: p.string().fieldName('description'),
    // virtual property whose name equals the `description` column
    description: p.string().persist(false).nullable(),
  },
});

const Book = defineEntity({
  name: 'Book',
  properties: {
    id: p.integer().primary(),
    title: p.string(),
    author: () => p.manyToOne(Author),
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Author, Book],
    dbName: ':memory:',
  });
  await orm.schema.create();
  orm.em.create(Book, {
    id: 1,
    title: 'Book',
    author: {
      id: 1,
      name: 'Default name',
      nameJson: '{"en":"Localized name"}',
      descriptionJson: '{"en":"Localized description"}',
    },
  });
  await orm.em.flush();
  orm.em.clear();
});

afterAll(() => orm.close(true));

test('GH #8526 joined populate selects columns whose name equals another property name', async () => {
  const mock = mockLogger(orm);
  const [book] = await orm.em.fork().find(Book, {}, { populate: ['author'], strategy: 'joined' });
  expect(mock.mock.calls[0][0]).toMatch(
    'select `b0`.*, `a1`.`id` as `a1__id`, `a1`.`default_name` as `a1__default_name`, `a1`.`name` as `a1__name`, `a1`.`description` as `a1__description` from `book` as `b0` inner join `author` as `a1` on `b0`.`author_id` = `a1`.`id`',
  );
  expect(book.author.name).toBe('Default name');
  expect(book.author.nameJson).toBe('{"en":"Localized name"}');
  expect(book.author.descriptionJson).toBe('{"en":"Localized description"}');
});

test('GH #8526 select-in strategy is unaffected', async () => {
  const [book] = await orm.em.fork().find(Book, {}, { populate: ['author'], strategy: 'select-in' });
  expect(book.author.name).toBe('Default name');
  expect(book.author.nameJson).toBe('{"en":"Localized name"}');
  expect(book.author.descriptionJson).toBe('{"en":"Localized description"}');
});
