import { Collection, Entity, Enum, ManyToOne, MikroORM, OneToMany, PrimaryKey, Property } from '@mikro-orm/core';
import { SqliteDriver } from '@mikro-orm/sqlite';

@Entity()
class Book {

  @PrimaryKey()
  id!: number;

  @OneToMany(() => Author, c => c.book)
  children = new Collection<Author>(this);

}

enum AuthorType {
  Apple = 'Apple',
  Banana = 'Banana',
}

@Entity()
class Author {

  @Property({ primary: true })
  id!: string;

  @Enum({ items: () => AuthorType, primary: true })
  type!: AuthorType;

  @ManyToOne(() => Book)
  book!: Book;

}
let orm: MikroORM<SqliteDriver>;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Author, Book],
    dbName: ':memory:',
    driver: SqliteDriver,
  });
  await orm.schema.createSchema();
});

afterAll(async () => {
  await orm.close(true);
});

test(`GH issue 3053`, async () => {
  const sql = orm.em.qb(Book).where({
    children: {
      id: '123ABC',
      type: AuthorType.Apple,
    },
  }).getFormattedQuery();
  expect(sql).toBe("select `b0`.* from `book` as `b0` left join `author` as `a1` on `b0`.`id` = `a1`.`book_id` where (`a1`.`id`, `a1`.`type`) in (('123ABC', 'Apple'))");
});
