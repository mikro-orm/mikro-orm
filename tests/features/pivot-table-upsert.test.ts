import { MikroORM, defineEntity, p } from '@mikro-orm/sqlite';

const Author = defineEntity({
  name: 'Author',
  properties: {
    id: p.integer().primary(),
    name: p.string(),
    books: () => p.manyToMany(Book).inversedBy('authors').owner(),
  },
});

const Book = defineEntity({
  name: 'Book',
  properties: {
    id: p.integer().primary(),
    title: p.string(),
    authors: () => p.manyToMany(Author).mappedBy('books'),
  },
});

const Student = defineEntity({
  name: 'Student',
  properties: {
    id: p.integer().primary(),
    name: p.string(),
    courses: () => p.manyToMany(Course).inversedBy('students').pivotEntity(() => Enrollment),
  },
});

const Course = defineEntity({
  name: 'Course',
  properties: {
    id: p.integer().primary(),
    title: p.string(),
    students: () => p.manyToMany(Student).mappedBy('courses').pivotEntity(() => Enrollment),
  },
});

const Enrollment = defineEntity({
  name: 'Enrollment',
  properties: {
    student: p.manyToOne(Student).primary(),
    course: p.manyToOne(Course).primary(),
    enrolledAt: p.datetime().nullable(),
  },
  uniques: [{
    properties: ['student', 'course'],
  }],
});

describe('pivot table with uninitialized collection (GH issue)', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Author, Book, Student, Course, Enrollment],
      dbName: ':memory:',
    });
    await orm.schema.createSchema();
  });

  afterAll(() => orm.close(true));

  beforeEach(() => orm.schema.clearDatabase());

  test('should not create duplicate pivot table entries when collection is not initialized', async () => {
    const author = orm.em.create(Author, { name: 'John Doe' });
    const book1 = orm.em.create(Book, { title: 'Book 1' });
    const book2 = orm.em.create(Book, { title: 'Book 2' });

    author.books.add(book1, book2);
    await orm.em.persist(author).flush();
    orm.em.clear();

    const loadedAuthor = await orm.em.findOneOrFail(Author, author.id);
    expect(loadedAuthor.books.isInitialized()).toBe(false);

    const book3 = orm.em.create(Book, { title: 'Book 3' });
    await orm.em.persist(book3).flush();

    // Re-add existing books (book1, book2) plus new book3 without initialization
    loadedAuthor.books.add(book1, book2, book3);
    await orm.em.flush();

    orm.em.clear();
    const authorWithBooks = await orm.em.findOneOrFail(Author, author.id, {
      populate: ['books'],
    });

    expect(authorWithBooks.books).toHaveLength(3);
    expect(
      authorWithBooks.books
        .getItems()
        .map(b => b.title)
        .sort(),
    ).toEqual(['Book 1', 'Book 2', 'Book 3']);

    const pivotRows = await orm.em.execute('select * from author_books');
    expect(pivotRows).toHaveLength(3);
  });

  test('initialized collection should use regular insert for additions', async () => {
    const author = orm.em.create(Author, { name: 'Jane Doe' });
    const book1 = orm.em.create(Book, { title: 'Book A' });
    const book2 = orm.em.create(Book, { title: 'Book B' });

    author.books.add(book1, book2);
    await orm.em.persist(author).flush();
    orm.em.clear();

    const loadedAuthor = await orm.em.findOneOrFail(Author, author.id, {
      populate: ['books'],
    });
    expect(loadedAuthor.books.isInitialized()).toBe(true);

    const book3 = orm.em.create(Book, { title: 'Book C' });
    await orm.em.persist(book3).flush();

    loadedAuthor.books.add(book3);
    await orm.em.flush();

    orm.em.clear();
    const authorWithBooks = await orm.em.findOneOrFail(Author, author.id, {
      populate: ['books'],
    });

    expect(authorWithBooks.books).toHaveLength(3);
    expect(
      authorWithBooks.books
        .getItems()
        .map(b => b.title)
        .sort(),
    ).toEqual(['Book A', 'Book B', 'Book C']);

    const pivotRows2 = await orm.em.execute('select * from author_books');
    expect(pivotRows2).toHaveLength(3);
  });

  test('uninitialized collection can be cleared and repopulated', async () => {
    const author = orm.em.create(Author, { name: 'Bob Smith' });
    const book1 = orm.em.create(Book, { title: 'Old Book 1' });
    const book2 = orm.em.create(Book, { title: 'Old Book 2' });
    const book3 = orm.em.create(Book, { title: 'Old Book 3' });

    author.books.add(book1, book2, book3);
    await orm.em.persist(author).flush();
    orm.em.clear();

    const loadedAuthor = await orm.em.findOneOrFail(Author, author.id);
    expect(loadedAuthor.books.isInitialized()).toBe(false);

    const book4 = orm.em.create(Book, { title: 'New Book 1' });
    await orm.em.persist(book4).flush();

    loadedAuthor.books.removeAll();
    loadedAuthor.books.add(book4);
    await orm.em.flush();

    orm.em.clear();
    const authorWithBooks = await orm.em.findOneOrFail(Author, author.id, {
      populate: ['books'],
    });

    expect(authorWithBooks.books).toHaveLength(1);
    expect(authorWithBooks.books.getItems()[0].title).toBe('New Book 1');

    const pivotRows = await orm.em.execute('select * from author_books');
    expect(pivotRows).toHaveLength(1);
  });

  test('initialized collection with removals should use exact diff', async () => {
    const author = orm.em.create(Author, { name: 'Alice Brown' });
    const book1 = orm.em.create(Book, { title: 'First Book' });
    const book2 = orm.em.create(Book, { title: 'Second Book' });
    const book3 = orm.em.create(Book, { title: 'Third Book' });

    author.books.add(book1, book2, book3);
    await orm.em.persist(author).flush();
    orm.em.clear();

    const loadedAuthor = await orm.em.findOneOrFail(Author, author.id, {
      populate: ['books'],
    });
    expect(loadedAuthor.books.isInitialized()).toBe(true);

    const bookToRemove = loadedAuthor.books.getItems().find(b => b.title === 'Second Book')!;
    loadedAuthor.books.remove(bookToRemove);
    await orm.em.flush();

    orm.em.clear();
    const authorWithBooks = await orm.em.findOneOrFail(Author, author.id, {
      populate: ['books'],
    });

    expect(authorWithBooks.books).toHaveLength(2);
    expect(
      authorWithBooks.books
        .getItems()
        .map(b => b.title)
        .sort(),
    ).toEqual(['First Book', 'Third Book']);

    const pivotRows = await orm.em.execute('select * from author_books');
    expect(pivotRows).toHaveLength(2);
  });

  test('uninitialized collection with set() should replace all entries', async () => {
    const author = orm.em.create(Author, { name: 'Charlie Wilson' });
    const book1 = orm.em.create(Book, { title: 'Old Book 1' });
    const book2 = orm.em.create(Book, { title: 'Old Book 2' });

    author.books.add(book1, book2);
    await orm.em.persist(author).flush();
    orm.em.clear();

    const loadedAuthor = await orm.em.findOneOrFail(Author, author.id);
    expect(loadedAuthor.books.isInitialized()).toBe(false);

    const book3 = orm.em.create(Book, { title: 'New Book 1' });
    const book4 = orm.em.create(Book, { title: 'New Book 2' });
    await orm.em.persist([book3, book4]).flush();

    loadedAuthor.books.set([book3, book4]);
    await orm.em.flush();

    orm.em.clear();
    const authorWithBooks = await orm.em.findOneOrFail(Author, author.id, {
      populate: ['books'],
    });

    expect(authorWithBooks.books).toHaveLength(2);
    expect(
      authorWithBooks.books
        .getItems()
        .map(b => b.title)
        .sort(),
    ).toEqual(['New Book 1', 'New Book 2']);

    const pivotRows = await orm.em.execute('select * from author_books');
    expect(pivotRows).toHaveLength(2);
  });

  test('uninitialized collection adding duplicate items multiple times should not create duplicates', async () => {
    const author = orm.em.create(Author, { name: 'David Lee' });
    const book1 = orm.em.create(Book, { title: 'Duplicate Test' });

    author.books.add(book1);
    await orm.em.persist(author).flush();
    orm.em.clear();

    const loadedAuthor = await orm.em.findOneOrFail(Author, author.id);
    expect(loadedAuthor.books.isInitialized()).toBe(false);

    loadedAuthor.books.add(book1);
    loadedAuthor.books.add(book1);
    loadedAuthor.books.add(book1);
    await orm.em.flush();

    orm.em.clear();
    const authorWithBooks = await orm.em.findOneOrFail(Author, author.id, {
      populate: ['books'],
    });

    expect(authorWithBooks.books).toHaveLength(1);
    expect(authorWithBooks.books.getItems()[0].title).toBe('Duplicate Test');

    const pivotRows = await orm.em.execute('select * from author_books');
    expect(pivotRows).toHaveLength(1);
  });

  test('mixed operations on initialized collection (add and remove)', async () => {
    const author = orm.em.create(Author, { name: 'Eve Martinez' });
    const book1 = orm.em.create(Book, { title: 'Stay 1' });
    const book2 = orm.em.create(Book, { title: 'Remove This' });
    const book3 = orm.em.create(Book, { title: 'Stay 2' });

    author.books.add(book1, book2, book3);
    await orm.em.persist(author).flush();
    orm.em.clear();

    const loadedAuthor = await orm.em.findOneOrFail(Author, author.id, {
      populate: ['books'],
    });
    expect(loadedAuthor.books.isInitialized()).toBe(true);

    const book4 = orm.em.create(Book, { title: 'New Addition' });
    await orm.em.persist(book4).flush();

    const bookToRemove = loadedAuthor.books.getItems().find(b => b.title === 'Remove This')!;
    loadedAuthor.books.remove(bookToRemove);
    loadedAuthor.books.add(book4);
    await orm.em.flush();

    orm.em.clear();
    const authorWithBooks = await orm.em.findOneOrFail(Author, author.id, {
      populate: ['books'],
    });

    expect(authorWithBooks.books).toHaveLength(3);
    expect(
      authorWithBooks.books
        .getItems()
        .map(b => b.title)
        .sort(),
    ).toEqual(['New Addition', 'Stay 1', 'Stay 2']);

    const pivotRows = await orm.em.execute('select * from author_books');
    expect(pivotRows).toHaveLength(3);
  });

  test('empty uninitialized collection adding items should work', async () => {
    const author = orm.em.create(Author, { name: 'Frank Taylor' });
    await orm.em.persist(author).flush();
    orm.em.clear();

    const loadedAuthor = await orm.em.findOneOrFail(Author, author.id);
    expect(loadedAuthor.books.isInitialized()).toBe(false);

    const book1 = orm.em.create(Book, { title: 'First Ever' });
    const book2 = orm.em.create(Book, { title: 'Second Ever' });
    await orm.em.persist([book1, book2]).flush();

    loadedAuthor.books.add(book1, book2);
    await orm.em.flush();

    orm.em.clear();
    const authorWithBooks = await orm.em.findOneOrFail(Author, author.id, {
      populate: ['books'],
    });

    expect(authorWithBooks.books).toHaveLength(2);
    expect(
      authorWithBooks.books
        .getItems()
        .map(b => b.title)
        .sort(),
    ).toEqual(['First Ever', 'Second Ever']);

    const pivotRows = await orm.em.execute('select * from author_books');
    expect(pivotRows).toHaveLength(2);
  });

  test('custom pivot entity with uninitialized collection should not create duplicates', async () => {
    const student = orm.em.create(Student, { name: 'Grace Chen' });
    const course1 = orm.em.create(Course, { title: 'Math 101' });
    const course2 = orm.em.create(Course, { title: 'Physics 101' });

    student.courses.add(course1, course2);
    await orm.em.persist(student).flush();
    orm.em.clear();

    const loadedStudent = await orm.em.findOneOrFail(Student, student.id);
    expect(loadedStudent.courses.isInitialized()).toBe(false);

    const course3 = orm.em.create(Course, { title: 'Chemistry 101' });
    await orm.em.persist(course3).flush();

    loadedStudent.courses.add(course1, course2, course3);
    await orm.em.flush();

    orm.em.clear();
    const studentWithCourses = await orm.em.findOneOrFail(Student, student.id, {
      populate: ['courses'],
    });

    expect(studentWithCourses.courses).toHaveLength(3);
    expect(
      studentWithCourses.courses
        .getItems()
        .map(c => c.title)
        .sort(),
    ).toEqual(['Chemistry 101', 'Math 101', 'Physics 101']);

    const enrollments = await orm.em.execute('select * from enrollment');
    expect(enrollments).toHaveLength(3);
  });

});
