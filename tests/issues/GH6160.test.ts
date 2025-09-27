import { Entity, ManyToOne, MikroORM, OneToMany, PrimaryKey, Property, Collection } from '@mikro-orm/sqlite';

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

  @Property()
  category!: string;

  @Property()
  priority!: number;

  @ManyToOne(() => Author)
  author!: Author;

}

describe('GH #6160 - Wrong order when combining filtered relations and limit', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Author, Book],
      dbName: ':memory:',
    });
    await orm.schema.createSchema();

    // Create test data that will expose the ordering issue
    const author = orm.em.create(Author, { name: 'Test Author' });

    // Create books with different categories and priorities
    // Books with category 'fiction' should be ordered by priority: 1, 3
    // Books with category 'non-fiction' have priorities: 2, 4
    // If WHERE condition is lost, the outer ORDER BY will see all books
    // and order them as: 1, 2, 3, 4 instead of just 1, 3
    orm.em.create(Book, { title: 'Book A', category: 'fiction', priority: 1, author });
    orm.em.create(Book, { title: 'Book B', category: 'non-fiction', priority: 2, author });
    orm.em.create(Book, { title: 'Book C', category: 'fiction', priority: 3, author });
    orm.em.create(Book, { title: 'Book D', category: 'non-fiction', priority: 4, author });

    await orm.em.flush();
    orm.em.clear();
  });

  afterAll(async () => {
    await orm.close();
  });

  test('should maintain correct order with filtered relations and limit', async () => {
    // This query should:
    // 1. Filter authors whose books have category 'fiction'
    // 2. Order by book priority
    // 3. Apply limit
    // The bug: WHERE condition is lost during pagination, causing wrong ordering
    const qb = orm.em.createQueryBuilder(Author, 'a')
      .leftJoin('a.books', 'b')
      .where({ 'b.category': 'fiction' })
      .orderBy({ 'b.priority': 'ASC' })
      .limit(10);

    const sql = qb.getQuery();

    // Check that the WHERE clause is preserved in the subquery
    expect(sql).toContain('fiction');

    // The outer query should have the IN condition AND the original where condition
    // should be applied to the subquery correctly
    const result = await qb.getResult();
    expect(result).toHaveLength(1);
  });

  test('should work correctly with findAndCount', async () => {
    // Test the actual findAndCount method that was mentioned in the issue
    const [authors, count] = await orm.em.findAndCount(Author, {
      books: { category: 'fiction' },
    }, {
      populate: ['books'],
      orderBy: { books: { priority: 'ASC' } },
      limit: 10,
    });

    expect(count).toBe(1);
    expect(authors).toHaveLength(1);

    // The populated books should only include fiction books, ordered correctly
    const books = authors[0].books.getItems();
    expect(books).toHaveLength(2);
    expect(books[0].priority).toBe(1);
    expect(books[1].priority).toBe(3);
    expect(books.every(b => b.category === 'fiction')).toBe(true);
  });
});
