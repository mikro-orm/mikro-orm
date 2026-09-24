import { Collection, MikroORM } from '@mikro-orm/core';
import {
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryKey,
  Property,
  ReflectMetadataProvider,
} from '@mikro-orm/decorators/legacy';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';

@Entity()
class Author {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @OneToMany(() => Book, b => b.author)
  books = new Collection<Book>(this);
}

@Entity()
class Book {
  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

  @Property({ nullable: true })
  genre?: string;

  @ManyToOne(() => Author)
  author!: Author;
}

let orm: MikroORM<PostgreSqlDriver>;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [Author, Book],
    dbName: 'mikro_orm_test_count_distinct',
    driver: PostgreSqlDriver,
  });
  await orm.schema.refresh();

  const a = orm.em.create(Author, { name: 'A' });
  const b = orm.em.create(Author, { name: 'B' });
  orm.em.create(Book, { title: 't1', author: a, genre: 'g1' });
  orm.em.create(Book, { title: 't2', author: a });
  orm.em.create(Book, { title: 't3', author: b });
  await orm.em.flush();
  orm.em.clear();
});

afterAll(() => orm.close(true));

test('getCount() respects distinct() set on the query', async () => {
  const qb = orm.em.createQueryBuilder(Book, 'b').select('b.*').distinct();
  expect(qb.clone().count().getQuery()).toBe('select count(distinct "b"."id") as "count" from "book" as "b"');
  await expect(qb.getCount()).resolves.toBe(3);

  const qb2 = orm.em.createQueryBuilder(Book, 'b').select('b.*').join('b.author', 'a').distinct();
  await expect(qb2.getCount()).resolves.toBe(3);
});

test('getCount() respects distinctOn() set on the query', async () => {
  const qb = orm.em.createQueryBuilder(Book, 'b').select('b.*').distinctOn(['b.author']);
  expect(qb.clone().count().getQuery()).toBe(
    'select count(*) as "count" from ( select distinct "b"."author_id" from "book" as "b" ) as "dcnt"',
  );
  await expect(qb.getResultList()).resolves.toHaveLength(2);
  await expect(qb.getCount()).resolves.toBe(2);

  const qb2 = orm.em.createQueryBuilder(Book, 'b').select('b.*').distinctOn(['b.author', 'b.title']);
  await expect(qb2.getCount()).resolves.toBe(3);

  // `distinct on` keeps one row for the null group
  const qb3 = orm.em.createQueryBuilder(Book, 'b').select('b.*').distinctOn(['b.genre']);
  await expect(qb3.getResultList()).resolves.toHaveLength(2);
  await expect(qb3.getCount()).resolves.toBe(2);
});
