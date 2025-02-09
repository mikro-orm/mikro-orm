import { Collection, Entity, JsonType, ManyToOne, MikroORM, OneToMany, PrimaryKey, Property } from '@mikro-orm/core';
import { MySqlDriver } from '@mikro-orm/mysql';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { SqliteDriver } from '@mikro-orm/sqlite';
import { mockLogger } from '../helpers.js';

@Entity()
export class Author {

  @PrimaryKey()
  id!: string;

  @OneToMany({
    entity: 'Book',
    mappedBy: 'author',
  })
  books = new Collection<Book>(this);

}

@Entity()
export class Book {

  @PrimaryKey()
  id!: string;

  @Property({ type: JsonType })
  data!: Record<string, unknown>;

  @ManyToOne(() => Author)
  author!: Author;

}

describe('aliasing of nested JSON queries (GH 3242)', () => {

  test('sqlite', async () => {
    const orm = await MikroORM.init({
      entities: [Book],
      dbName: ':memory:',
      driver: SqliteDriver,
    });
    await orm.schema.createSchema();

    const mock = mockLogger(orm);
    await orm.em.find(Author, { books: { data: { title: 'test' } } });
    await orm.em.find(Author, { books: { id: 'test' } });
    await orm.em.find(Book, { data: { title: 'test' } });

    expect(mock.mock.calls[0][0]).toMatch("select `a0`.* from `author` as `a0` left join `book` as `b1` on `a0`.`id` = `b1`.`author_id` where json_extract(`b1`.`data`, '$.title') = 'test'");
    expect(mock.mock.calls[1][0]).toMatch("select `a0`.* from `author` as `a0` left join `book` as `b1` on `a0`.`id` = `b1`.`author_id` where `b1`.`id` = 'test'");
    expect(mock.mock.calls[2][0]).toMatch("select `b0`.* from `book` as `b0` where json_extract(`b0`.`data`, '$.title') = 'test'");

    await orm.close(true);
  });

  test('mysql', async () => {
    const orm = await MikroORM.init({
      entities: [Book],
      dbName: 'mikro_orm_test_3242',
      driver: MySqlDriver,
      port: 3308,
    });
    await orm.schema.refreshDatabase();

    const mock = mockLogger(orm);
    await orm.em.find(Author, { books: { data: { title: 'test' } } });
    await orm.em.find(Author, { books: { id: 'test' } });
    await orm.em.find(Book, { data: { title: 'test' } });

    expect(mock.mock.calls[0][0]).toMatch("select `a0`.* from `author` as `a0` left join `book` as `b1` on `a0`.`id` = `b1`.`author_id` where json_extract(`b1`.`data`, '$.title') = 'test'");
    expect(mock.mock.calls[1][0]).toMatch("select `a0`.* from `author` as `a0` left join `book` as `b1` on `a0`.`id` = `b1`.`author_id` where `b1`.`id` = 'test'");
    expect(mock.mock.calls[2][0]).toMatch("select `b0`.* from `book` as `b0` where json_extract(`b0`.`data`, '$.title') = 'test'");

    await orm.close(true);
  });

  test('postgres', async () => {
    const orm = await MikroORM.init({
      entities: [Book],
      dbName: 'mikro_orm_test_3242',
      driver: PostgreSqlDriver,
    });
    await orm.schema.refreshDatabase();

    const mock = mockLogger(orm);
    await orm.em.find(Author, { books: { data: { title: 'test' } } });
    await orm.em.find(Author, { books: { id: 'test' } });
    await orm.em.find(Book, { data: { title: 'test' } });

    expect(mock.mock.calls[0][0]).toMatch(`select "a0".* from "author" as "a0" left join "book" as "b1" on "a0"."id" = "b1"."author_id" where "b1"."data"->>'title' = 'test'`);
    expect(mock.mock.calls[1][0]).toMatch(`select "a0".* from "author" as "a0" left join "book" as "b1" on "a0"."id" = "b1"."author_id" where "b1"."id" = 'test'`);
    expect(mock.mock.calls[2][0]).toMatch(`select "b0".* from "book" as "b0" where "b0"."data"->>'title' = 'test'`);

    await orm.close(true);
  });

});
