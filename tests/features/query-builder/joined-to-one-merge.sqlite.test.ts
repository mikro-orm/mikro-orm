import { Collection, MikroORM, type Rel, sql } from '@mikro-orm/sqlite';
import {
  Entity,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryKey,
  Property,
  ReflectMetadataProvider,
} from '@mikro-orm/decorators/legacy';

@Entity()
class Publisher {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;
}

@Entity()
class Author {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @ManyToOne(() => Publisher, { nullable: true })
  publisher?: Publisher;

  @OneToMany(() => Book, b => b.author)
  books = new Collection<Book>(this);

  @OneToOne(() => Profile, p => p.author, { nullable: true })
  profile?: Rel<Profile>;
}

@Entity()
class Book {
  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

  @ManyToOne(() => Author)
  author!: Author;
}

@Entity()
class Profile {
  @PrimaryKey()
  id!: number;

  // no unique constraint, so the inverse side can match more than one row
  @OneToOne(() => Author, a => a.profile, { owner: true, unique: false })
  author!: Author;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [Publisher, Author, Book, Profile],
    dbName: ':memory:',
  });
  await orm.schema.create();
  const em = orm.em.fork();
  const p1 = em.create(Publisher, { id: 1, name: 'p1' });
  const a1 = em.create(Author, { id: 1, name: 'a1', publisher: p1 });
  const a2 = em.create(Author, { id: 2, name: 'a2', publisher: p1 });
  em.create(Author, { id: 3, name: 'a3' });
  em.create(Book, { id: 1, title: 'b1', author: a1 });
  em.create(Book, { id: 2, title: 'b2', author: a1 });
  em.create(Book, { id: 3, title: 'b3', author: a2 });
  await em.flush();
  await em.getConnection().execute('insert into profile (id, author_id) values (1, 1), (2, 1)');
});

afterAll(() => orm.close(true));

test('to-one joined populate returns every root row once', async () => {
  const authors = await orm.em
    .fork()
    .createQueryBuilder(Author, 'a')
    .leftJoinAndSelect('a.publisher', 'p')
    .orderBy({ id: 'asc' })
    .execute('all');
  expect(authors.map(a => [a.id, a.publisher?.name])).toEqual([
    [1, 'p1'],
    [2, 'p1'],
    [3, undefined],
  ]);
});

test('a plain to-many join next to a to-one joined populate still merges repeated root rows', async () => {
  const authors = await orm.em
    .fork()
    .createQueryBuilder(Author, 'a')
    .leftJoin('a.books', 'b')
    .leftJoinAndSelect('a.publisher', 'p')
    .orderBy({ id: 'asc' })
    .execute('all');
  expect(authors.map(a => a.id)).toEqual([1, 2, 3]);
});

test('a sub-query join next to a to-one joined populate still merges repeated root rows', async () => {
  const em = orm.em.fork();
  const books = em.createQueryBuilder(Book, 'bb').select(['id', 'author']);
  const authors = await em
    .createQueryBuilder(Author, 'a')
    .leftJoin(books, 'sb', { author_id: sql.ref('a.id') })
    .leftJoinAndSelect('a.publisher', 'p')
    .orderBy({ id: 'asc' })
    .execute('all');
  expect(authors.map(a => a.id)).toEqual([1, 2, 3]);
});

test('an inverse 1:1 joined populate matching several rows still merges repeated root rows', async () => {
  const authors = await orm.em
    .fork()
    .createQueryBuilder(Author, 'a')
    .leftJoinAndSelect('a.profile', 'pr')
    .orderBy({ id: 'asc' })
    .execute('all');
  expect(authors.map(a => a.id)).toEqual([1, 2, 3]);
});
