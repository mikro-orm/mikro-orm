/* eslint-disable eqeqeq */
import type { Platform } from '@mikro-orm/core';
import {
  Collection,
  Entity,
  ManyToOne,
  MikroORM,
  OneToMany,
  OptionalProps,
  PrimaryKey,
  PrimaryKeyProp,
  Property,
  Type,
} from '@mikro-orm/core';
import { mockLogger } from '../../helpers.js';
import { SqliteDriver } from '@mikro-orm/sqlite';

class TransformType extends Type<0 | number | Date> {

  override getColumnType() {
    return 'integer';
  }

  override convertToJSValue(value: 0 | number | Date): 0 | number | Date {
    return (value as unknown == '0' || value == null || value == 0) ? 0 : new Date(value);
  }

  override convertToDatabaseValue(value: 0 | number | Date): 0 | number | Date {
    if (value == null || value as unknown == '0' || value == 0) {
      return 0;
    }

    if (value instanceof Date) {
      return value.getTime();
    }

    return new Date(value).getTime();
  }

  override toJSON(value: 0 | number | Date, platform: Platform): 0 | number | Date {
    return super.convertToDatabaseValue(value, platform);
  }

}

@Entity()
export class Author {

  @PrimaryKey({ length: 30 })
  id!: string;

  @PrimaryKey({ type: TransformType })
  deletedDate: Date | 0 = 0;

  [PrimaryKeyProp]?: ['id', 'deletedDate'];

  [OptionalProps]?: 'deletedDate' | 'version';

  @Property()
  name!: string;

  @Property({ version: true, default: 1 })
  version: number = 1;

  @OneToMany(() => Book, book => book.author)
  books = new Collection<Book>(this);

}

@Entity()
export class Book {

  [PrimaryKeyProp]?: 'bookId';

  [OptionalProps]?: 'bookId';

  @PrimaryKey()
  bookId!: number;

  @Property()
  title!: string;

  @ManyToOne(() => Author)
  author!: Author;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Author, Book],
    dbName: `:memory:`,
    driver: SqliteDriver,
  });
  await orm.schema.createSchema();
});

afterAll(() => orm.close(true));

test('custom date like mapped type in composite PK (GH 3209)', async () => {
  const mock = mockLogger(orm);

  const author = orm.em.create(Author, {
    id: 'a1',
    name: 'John',
    books: [
      { title: 'b1' },
      { title: 'b2' },
      { title: 'b3' },
    ],
  });
  await orm.em.persist(author).flush();
  author.deletedDate = new Date();
  await orm.em.flush();
  orm.em.clear();

  const a1 = await orm.em.findOneOrFail(Author, author);
  a1.name = 'new';
  await orm.em.flush();
  orm.em.clear();

  const a2 = await orm.em.findOneOrFail(Author, author);
  a2.deletedDate = 0;
  await orm.em.flush();

  expect(mock.mock.calls[0][0]).toMatch(`begin`);
  expect(mock.mock.calls[2][0]).toMatch("insert into `book` (`title`, `author_id`, `author_deleted_date`) values ('b1', 'a1', 0), ('b2', 'a1', 0), ('b3', 'a1', 0) returning `book_id`");
  expect(mock.mock.calls[3][0]).toMatch(`commit`);
  expect(mock.mock.calls[4][0]).toMatch(`begin`);
  expect(mock.mock.calls[5][0]).toMatch(/update `author` set `deleted_date` = \d+, `version` = `version` \+ 1 where `id` = 'a1' and `deleted_date` = 0 and `version` = 1 returning `version`/);
  expect(mock.mock.calls[6][0]).toMatch(/update `book` set `author_id` = case when \(`book_id` = 1\) then 'a1' when \(`book_id` = 2\) then 'a1' when \(`book_id` = 3\) then 'a1' else `author_id` end, `author_deleted_date` = case when \(`book_id` = 1\) then \d+ when \(`book_id` = 2\) then \d+ when \(`book_id` = 3\) then \d+ else `author_deleted_date` end where `book_id` in \(1, 2, 3\)/);
  expect(mock.mock.calls[7][0]).toMatch(`commit`);
  expect(mock.mock.calls[8][0]).toMatch(/select `a0`.* from `author` as `a0` where \(`a0`.`id`, `a0`.`deleted_date`\) in \(\('a1', \d+\)\) limit 1/);
  expect(mock.mock.calls[9][0]).toMatch(`begin`);
  expect(mock.mock.calls[10][0]).toMatch(/update `author` set `name` = 'new', `version` = `version` \+ 1 where `id` = 'a1' and `deleted_date` = \d+ and `version` = 2 returning `version`/);
  expect(mock.mock.calls[11][0]).toMatch(`commit`);
  expect(mock.mock.calls[12][0]).toMatch(/select `a0`.* from `author` as `a0` where \(`a0`.`id`, `a0`.`deleted_date`\) in \(\('a1', \d+\)\) limit 1/);
  expect(mock.mock.calls[13][0]).toMatch(`begin`);
  expect(mock.mock.calls[14][0]).toMatch(/update `author` set `deleted_date` = 0, `version` = `version` \+ 1 where `id` = 'a1' and `deleted_date` = \d+ and `version` = 3 returning `version`/);
  expect(mock.mock.calls[15][0]).toMatch(`commit`);
});
