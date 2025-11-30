import {
  Collection,
  Entity,
  ManyToMany,
  ManyToOne,
  PrimaryKey,
  PrimaryKeyProp,
  Property,
} from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/sqlite';

@Entity()
export class Author {

  @PrimaryKey()
  id!: number;

  @Property()
  name: string;

  @ManyToMany({ entity: () => Book, owner: true })
  books = new Collection<Book>(this);

  constructor(name: string) {
    this.name = name;
  }

}

@Entity()
export class Book {

  @PrimaryKey()
  id!: number;

  @Property()
  title: string;

  @ManyToMany(() => Author, a => a.books)
  authors = new Collection<Author>(this);

  constructor(title: string) {
    this.title = title;
  }

}

@Entity()
export class Student {

  @PrimaryKey()
  id!: number;

  @Property()
  name: string;

  @ManyToMany({ entity: () => Course, pivotEntity: () => Enrollment })
  courses = new Collection<Course>(this);

  constructor(name: string) {
    this.name = name;
  }

}

@Entity()
export class Course {

  @PrimaryKey()
  id!: number;

  @Property()
  title: string;

  @ManyToMany(() => Student, s => s.courses)
  students = new Collection<Student>(this);

  constructor(title: string) {
    this.title = title;
  }

}

@Entity()
export class Enrollment {

  @ManyToOne({ primary: true })
  student: Student;

  @ManyToOne({ primary: true })
  course: Course;

  @Property({ nullable: true })
  enrolledAt?: Date;

  [PrimaryKeyProp]?: ['student', 'course'];

  constructor(student: Student, course: Course) {
    this.student = student;
    this.course = course;
  }

}

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
    const author = new Author('John Doe');
    const book1 = new Book('Book 1');
    const book2 = new Book('Book 2');

    author.books.add(book1, book2);
    await orm.em.persistAndFlush(author);
    orm.em.clear();

    const loadedAuthor = await orm.em.findOneOrFail(Author, author.id);
    expect(loadedAuthor.books.isInitialized()).toBe(false);

    const book3 = new Book('Book 3');
    await orm.em.persistAndFlush(book3);

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

    const pivotRows = await orm.em.getKnex().select('*').from('author_books');
    expect(pivotRows).toHaveLength(3);
  });

  test('initialized collection should use regular insert for additions', async () => {
    const author = new Author('Jane Doe');
    const book1 = new Book('Book A');
    const book2 = new Book('Book B');

    author.books.add(book1, book2);
    await orm.em.persistAndFlush(author);
    orm.em.clear();

    const loadedAuthor = await orm.em.findOneOrFail(Author, author.id, {
      populate: ['books'],
    });
    expect(loadedAuthor.books.isInitialized()).toBe(true);

    const book3 = new Book('Book C');
    await orm.em.persistAndFlush(book3);

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

    const pivotRows2 = await orm.em.getKnex().select('*').from('author_books');
    expect(pivotRows2).toHaveLength(3);
  });

  test('uninitialized collection can be cleared and repopulated', async () => {
    const author = new Author('Bob Smith');
    const book1 = new Book('Old Book 1');
    const book2 = new Book('Old Book 2');
    const book3 = new Book('Old Book 3');

    author.books.add(book1, book2, book3);
    await orm.em.persistAndFlush(author);
    orm.em.clear();

    const loadedAuthor = await orm.em.findOneOrFail(Author, author.id);
    expect(loadedAuthor.books.isInitialized()).toBe(false);

    const book4 = new Book('New Book 1');
    await orm.em.persistAndFlush(book4);

    loadedAuthor.books.removeAll();
    loadedAuthor.books.add(book4);
    await orm.em.flush();

    orm.em.clear();
    const authorWithBooks = await orm.em.findOneOrFail(Author, author.id, {
      populate: ['books'],
    });

    expect(authorWithBooks.books).toHaveLength(1);
    expect(authorWithBooks.books.getItems()[0].title).toBe('New Book 1');

    const pivotRows = await orm.em.getKnex().select('*').from('author_books');
    expect(pivotRows).toHaveLength(1);
  });

  test('initialized collection with removals should use exact diff', async () => {
    const author = new Author('Alice Brown');
    const book1 = new Book('First Book');
    const book2 = new Book('Second Book');
    const book3 = new Book('Third Book');

    author.books.add(book1, book2, book3);
    await orm.em.persistAndFlush(author);
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

    const pivotRows = await orm.em.getKnex().select('*').from('author_books');
    expect(pivotRows).toHaveLength(2);
  });

  test('uninitialized collection with set() should replace all entries', async () => {
    const author = new Author('Charlie Wilson');
    const book1 = new Book('Old Book 1');
    const book2 = new Book('Old Book 2');

    author.books.add(book1, book2);
    await orm.em.persistAndFlush(author);
    orm.em.clear();

    const loadedAuthor = await orm.em.findOneOrFail(Author, author.id);
    expect(loadedAuthor.books.isInitialized()).toBe(false);

    const book3 = new Book('New Book 1');
    const book4 = new Book('New Book 2');
    await orm.em.persistAndFlush([book3, book4]);

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

    const pivotRows = await orm.em.getKnex().select('*').from('author_books');
    expect(pivotRows).toHaveLength(2);
  });

  test('uninitialized collection adding duplicate items multiple times should not create duplicates', async () => {
    const author = new Author('David Lee');
    const book1 = new Book('Duplicate Test');

    author.books.add(book1);
    await orm.em.persistAndFlush(author);
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

    const pivotRows = await orm.em.getKnex().select('*').from('author_books');
    expect(pivotRows).toHaveLength(1);
  });

  test('mixed operations on initialized collection (add and remove)', async () => {
    const author = new Author('Eve Martinez');
    const book1 = new Book('Stay 1');
    const book2 = new Book('Remove This');
    const book3 = new Book('Stay 2');

    author.books.add(book1, book2, book3);
    await orm.em.persistAndFlush(author);
    orm.em.clear();

    const loadedAuthor = await orm.em.findOneOrFail(Author, author.id, {
      populate: ['books'],
    });
    expect(loadedAuthor.books.isInitialized()).toBe(true);

    const book4 = new Book('New Addition');
    await orm.em.persistAndFlush(book4);

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

    const pivotRows = await orm.em.getKnex().select('*').from('author_books');
    expect(pivotRows).toHaveLength(3);
  });

  test('empty uninitialized collection adding items should work', async () => {
    const author = new Author('Frank Taylor');
    await orm.em.persistAndFlush(author);
    orm.em.clear();

    const loadedAuthor = await orm.em.findOneOrFail(Author, author.id);
    expect(loadedAuthor.books.isInitialized()).toBe(false);

    const book1 = new Book('First Ever');
    const book2 = new Book('Second Ever');
    await orm.em.persistAndFlush([book1, book2]);

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

    const pivotRows = await orm.em.getKnex().select('*').from('author_books');
    expect(pivotRows).toHaveLength(2);
  });

  test('custom pivot entity with uninitialized collection should not create duplicates', async () => {
    const student = new Student('Grace Chen');
    const course1 = new Course('Math 101');
    const course2 = new Course('Physics 101');

    student.courses.add(course1, course2);
    await orm.em.persistAndFlush(student);
    orm.em.clear();

    const loadedStudent = await orm.em.findOneOrFail(Student, student.id);
    expect(loadedStudent.courses.isInitialized()).toBe(false);

    const course3 = new Course('Chemistry 101');
    await orm.em.persistAndFlush(course3);

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

    const enrollments = await orm.em.getKnex().select('*').from('enrollment');
    expect(enrollments).toHaveLength(3);
  });
});
