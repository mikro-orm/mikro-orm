import { Collection, Entity, MikroORM, PrimaryKey, ManyToOne, OneToMany, Property, Ref, ref } from '@mikro-orm/sqlite';

@Entity()
class Author {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @OneToMany(() => Book, book => book.author)
  books: Collection<Book> = new Collection<Book>(this);

  @ManyToOne(() => Author, { nullable: true, ref: true })
  mentor!: Ref<Author> | null;

  @OneToMany(() => Author, author => author.mentor)
  mentee: Collection<Author> = new Collection<Author>(this);

}

@Entity()
class Book {

  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Author, { ref: true })
  author!: Ref<Author>;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [Author, Book],
  });
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

test('GH #6531', async () => {
  let author = orm.em.create(Author, { name: 'Stephen' });
  author.mentor = ref(author);
  orm.em.create(Book, { author });
  await orm.em.flush();
  orm.em.clear();

  author = await orm.em.findOneOrFail(Author, { name: 'Stephen' });
  const loadedAuthor = await orm.em.populate(author, ['mentor.books']);
  expect(loadedAuthor.mentor?.$.books).toHaveLength(1);
});
