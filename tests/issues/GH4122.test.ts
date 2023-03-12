import {
  Entity,
  Property,
  PrimaryKey,
  Ref,
  OneToOne,
  OptionalProps,
  SimpleLogger,
} from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/sqlite';
import { mockLogger } from '../helpers';

@Entity()
export class Book {

  [OptionalProps]?: 'version';

  @PrimaryKey()
  id!: string;

  @OneToOne({ entity: () => Book, inversedBy: 'sequel', ref: true, nullable: true })
  prequel?: Ref<Book>;

  @OneToOne({ entity: () => Book, mappedBy: 'prequel', ref: true, nullable: true })
  sequel?: Ref<Book>;

  @Property({ version: true })
  version!: number;

  @Property()
  title!: string;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [Book],
    loggerFactory: options => new SimpleLogger(options),
  });
  await orm.schema.refreshDatabase();
});

afterAll(() => orm.close(true));

beforeEach(async () => {
  await orm.schema.clearDatabase();
  orm.em.create(Book, { id: 'book1', title: 'book1' });
  orm.em.create(Book, { id: 'book2', title: 'book2', prequel: 'book1' });
  await orm.em.flush();
  orm.em.clear();
});

test('updating versioned reference (4121)', async () => {
  const refetchedBook1 = await orm.em.findOneOrFail(Book, { id: 'book1' });
  refetchedBook1.title = 'updatedBook1';
  refetchedBook1.sequel!.unwrap().title = 'updatedBook2';
  await expect(orm.em.flush()).resolves.not.toThrow();
});

test('extra updates (4121)', async () => {
  const refetchedBook1 = await orm.em.findOneOrFail(Book, { id: 'book1' });
  refetchedBook1.title = 'updatedBook1';
  const mock = mockLogger(orm);
  await expect(orm.em.flush()).resolves.not.toThrow();
  expect(mock.mock.calls).toEqual([
    ['[query] begin'],
    ["[query] update `book` set `title` = 'updatedBook1', `version` = `version` + 1 where `id` = 'book1' and `version` = 1"],
    ["[query] select `b0`.`id`, `b0`.`version` from `book` as `b0` where `b0`.`id` in ('book1')"],
    ['[query] commit'],
  ]);
});

test('4122', async () => {
  const qb = orm.em.createQueryBuilder(Book);
  await qb.update({ title: 'updatedTitle' }).where({ sequel: null });

  const [book1, book2] = await orm.em.find(Book, {});
  expect(book1.title).toEqual('book1');
  expect(book2.title).toEqual('updatedTitle');
});
