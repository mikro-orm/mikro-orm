import { Collection, Entity, ManyToMany, ManyToOne, MikroORM, OneToMany, PrimaryKey, Property } from '@mikro-orm/postgresql';

@Entity({ tableName: 'authors', schema: '*' })
class Author {

  @PrimaryKey()
  id!: number;

  @Property({ length: 128 })
  name!: string;

  @OneToMany(() => Book, item => item.author, { cascade: [], orphanRemoval: true })
  books = new Collection<Book>(this);

}

@Entity({ tableName: 'tags', schema: '*' })
class Tag {

  @PrimaryKey()
  id!: number;

  @Property({ length: 128 })
  label!: string;

}

@Entity({ tableName: 'books', schema: '*' })
class Book {

  @PrimaryKey()
  id!: number;

  @Property({ length: 128 })
  title!: string;

  @ManyToOne({ entity: () => Author, strategy: 'joined', deleteRule: 'cascade' })
  author!: Author;

  @ManyToMany({ entity: () => Tag, cascade: [], orderBy: { label: 'asc' } })
  tags = new Collection<Tag>(this);

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Author, Book, Tag],
    dbName: '6511',
    schema: 'public',
  });
  await orm.schema.refreshDatabase({ schema: 'my_schema' });
});

afterAll(async () => {
  await orm.close(true);
});

test('GH #6511', async () => {
  // Create one instance from each entity
  const em = orm.em.fork({ schema: 'my_schema' });

  let tagId = -1;

  const author = em.create(Author, { name: 'Author' });
  const tag = em.create(Tag, { label: 'Novel' });
  const book = em.create(Book, { title: 'Book', author, tags: [] });
  await em.flush();
  tagId = tag.id;
  em.clear();

  // Second find fails. Using JOINED strategy or using tag via find during book creation prevents the error
  {
    const author = await em.findOneOrFail(Author, { name: 'Author' }, {
      populate: ['books', 'books.tags'],
      strategy: 'select-in',
    });

    em.create(Book, { title: 'Book2', author, tags: [tagId] });
    await em.flush();

    const author2 = await em.findOneOrFail(Author, { name: 'Author' }, {
      populate: ['books', 'books.tags'],
      strategy: 'select-in',
    });
    em.clear();
  }
});
