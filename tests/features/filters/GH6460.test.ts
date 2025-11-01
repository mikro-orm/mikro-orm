import {
  Collection,
  Entity,
  Filter,
  LoadStrategy,
  ManyToOne,
  MikroORM,
  OneToMany,
  OneToOne,
  PrimaryKey,
  Property,
  Rel,
} from '@mikro-orm/sqlite';
import { mockLogger } from '../../helpers';

@Entity()
@Filter({ name: 'softDelete', cond: { deletedAt: null }, default: true })
class Author {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @OneToMany(() => Book, book => book.author)
  books = new Collection<Book>(this);

  @Property({ nullable: true })
  deletedAt?: Date;

}

@Entity()
class Book {

  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

  @ManyToOne(() => Author)
  author!: Author;

  @OneToOne(() => Cover, cover => cover.book)
  cover?: Rel<Cover>;

}

@Entity()
class Cover {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @OneToOne(() => Book, book => book.cover, { owner: true, nullable: true })
  book!: Book | null;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [Author, Book, Cover],
  });
  await orm.schema.refreshDatabase();

  const author = orm.em.create(Author, { name: 'John Doe', deletedAt: new Date() });
  const book = orm.em.create(Book, { title: 'Book 1', author });
  orm.em.create(Cover, { name: 'Cover 1', book });
  await orm.em.flush();
  orm.em.clear();
});

afterAll(async () => {
  await orm.close(true);
});

test.each(Object.values(LoadStrategy))('GH #6460 using "%s" strategy', async strategy => {
  const books = await orm.em.findAll(Book);
  expect(books).toHaveLength(0);

  const cover = await orm.em.findOneOrFail(Cover, { name: 'Cover 1' }, {
    populate: ['book'],
    strategy,
  });
  expect(cover.book).toBeNull();

  const mock = mockLogger(orm);
  await orm.em.flush();
  expect(mock).not.toHaveBeenCalled();
});
