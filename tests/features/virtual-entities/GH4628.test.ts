import { Entity, PrimaryKey, Property, SimpleLogger } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/postgresql';
import { mockLogger } from '../../bootstrap';

@Entity()
class Book {

  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

}

@Entity({ expression: 'select title from book' })
class BookSimple {

  @Property()
  title!: string;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: 'virtual_entities',
    entities: [Book, BookSimple],
    loggerFactory: SimpleLogger.create,
  });
  await orm.schema.refreshDatabase();
});
beforeEach(async () => orm.schema.clearDatabase());
afterAll(async () => orm.close(true));

test('virtual entities (postgres)', async () => {
  const mock = mockLogger(orm);
  await orm.em.findAndCount(BookSimple, {}, { orderBy: { title: 1 } });
  expect(mock.mock.calls.map(r => r[0]).sort()).toEqual([
    `[query] select * from (select title from book) as "b0" order by "b0"."title" asc`,
    `[query] select count(*) as "count" from (select title from book) as "b0"`,
  ]);
});
