import { Collection, MikroORM } from '@mikro-orm/sqlite';
import { Entity, ManyToMany, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity({ tableName: 'authors' })
class Author {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @ManyToMany(() => Book)
  books = new Collection<Book>(this);
}

@Entity({ tableName: 'books' })
class Book {
  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

  @ManyToMany(() => Author, a => a.books)
  authors = new Collection<Author>(this);
}

test('GHx35: pivot join column names should use className, not tableName', async () => {
  const orm = await MikroORM.init({
    entities: [Author, Book],
    dbName: ':memory:',
    metadataProvider: ReflectMetadataProvider,
  });

  const meta = orm.getMetadata().get(Author);
  const booksProp = meta.properties.books;

  // FK columns in pivot tables should derive from entity class name, not table name
  expect(booksProp.joinColumns).toEqual(['author_id']);
  expect(booksProp.inverseJoinColumns).toEqual(['book_id']);

  const sql = await orm.schema.getCreateSchemaSQL();
  // pivot table should have author_id and book_id, not authors_id and books_id
  expect(sql).toContain('author_id');
  expect(sql).toContain('book_id');
  expect(sql).not.toContain('authors_id');
  expect(sql).not.toContain('books_id');

  await orm.close();
});
