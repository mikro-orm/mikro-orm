import {
  Entity,
  Property,
  PrimaryKey,
  Ref,
  OneToOne,
  OptionalProps,
} from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/sqlite';

@Entity()
export class Book {

  [OptionalProps]?: 'version';

  @PrimaryKey()
  id!: string;

  @OneToOne({ entity: () => Book, inversedBy: 'sequel', ref: true, nullable: true })
  prequel?: Ref<Book>;

  @OneToOne({ entity: () => Book, mappedBy: 'prequel', ref: true, nullable: true })
  sequel?: Ref<Book>;

  @Property()
  title!: string;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [Book],
  });
  await orm.schema.refreshDatabase();
});

afterAll(() => orm.close(true));

test('4122', async () => {
  const book1 = orm.em.create(Book, { id: 'book1', title: 'book1' });
  const book2 = orm.em.create(Book, { id: 'book2', title: 'book2', prequel: 'book1' });
  await orm.em.flush();
  orm.em.clear();

  const qb = orm.em.createQueryBuilder(Book);
  await qb.update({ title: 'updatedTitle' }).where({ sequel: null });

  await orm.em.refresh(book1);
  await orm.em.refresh(book2);
  expect(book1.title).toEqual('book1');
  expect(book2.title).toEqual('updatedTitle');
});
