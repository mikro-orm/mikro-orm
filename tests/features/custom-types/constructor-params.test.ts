import {
  Collection,
  Entity,
  ManyToOne,
  MikroORM,
  OneToMany,
  PrimaryKey,
  Property,
  Type,
  Platform,
  EntityProperty,
  ValidationError,
} from '@mikro-orm/sqlite';
import { v4 } from 'uuid';

class IdentityType extends String {

  constructor(id = v4()) {
    super(id);
  }

}

class MikroormIdentityType<SubType> extends Type<IdentityType, string> {

  private readonly className;

  constructor(className: new (value: string) => SubType) {
    super();
    this.className = className;
  }

  convertToDatabaseValue(value: IdentityType | string): string {
    if (typeof value === 'object') {
      if (!(value instanceof IdentityType)) {
        throw ValidationError.invalidType(MikroormIdentityType, value, 'JS');
      }
      return value.toString();
    } else if (typeof value === 'string' && value) {
      return value;
    }

    throw ValidationError.invalidType(MikroormIdentityType, value, 'JS');
  }

  compareValues(a: IdentityType | string, b: IdentityType | string): boolean {
    return a.valueOf() === b.valueOf();
  }

  convertToJSValue(value: IdentityType | string | undefined): IdentityType {
    if (!value || value instanceof IdentityType) {
      return value as IdentityType;
    }

    return new this.className(value) as IdentityType;
  }

  getColumnType(prop: EntityProperty, platform: Platform) {
    return platform.getUuidTypeDeclarationSQL({});
  }

}

@Entity()
class User {

  @PrimaryKey({
    type: new MikroormIdentityType<IdentityType>(IdentityType),
  })
  id: IdentityType = new IdentityType();

  @Property()
  name: string;

  @OneToMany<Book, User>({
    entity: () => Book,
    mappedBy: book => book.user,
  })
  books = new Collection<Book, this>(this);

  constructor(id: IdentityType, name: string) {
    this.id = id;
    this.name = name;
  }

}

@Entity()
class Book {

  @PrimaryKey({
    type: new MikroormIdentityType(IdentityType),
  })
  id: IdentityType = new IdentityType();

  @Property()
  name: string;

  @ManyToOne({
    entity: () => User,
    inversedBy: user => user.books,
  })
  user: User;

  @OneToMany<BookNote, Book>({
    entity: () => BookNote,
    mappedBy: note => note.book,
  })
  notes = new Collection<BookNote, this>(this);

  constructor(id: IdentityType, name: string, user: User) {
    this.id = id;
    this.name = name;
    this.user = user;
  }

}

@Entity()
class BookNote {

  @PrimaryKey({
    type: new MikroormIdentityType(IdentityType),
  })
  id: IdentityType = new IdentityType();

  @Property()
  name: string;

  @ManyToOne({
    entity: () => Book,
    inversedBy: book => book.notes,
  })
  book: Book;

  constructor(id: IdentityType, name: string, book: Book) {
    this.id = id;
    this.name = name;
    this.book = book;
  }

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [User, Book],
    forceEntityConstructor: true,
  });
  await orm.schema.refreshDatabase();
});

beforeEach(async () => {
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

test(`should don't throw error on custom type 1`, async () => {
  const userId = new IdentityType();
  const bookId = new IdentityType();

  orm.em.create(User, {
    id: userId,
    name: 'Foo',
    books: [{ id: bookId, name: 'book-1' }],
  });
  await orm.em.flush();
  orm.em.clear();

  await orm.em.findOne(Book, bookId, {
    populate: ['user'],
  });
});

test(`should don't throw error on custom type 2`, async () => {
  const userId = new IdentityType();
  const bookId = new IdentityType();
  const bookNoteId01 = new IdentityType();
  const bookNoteId02 = new IdentityType();

  const user = orm.em.create(User, {
    id: userId,
    name: 'Foo',
  });
  const book = new Book(bookId, 'book-1', user);

  book.notes.add(new BookNote(bookNoteId01, 'tag_01', book));
  book.notes.add(new BookNote(bookNoteId02, 'tag_02', book));

  user.books.add(book);
  await orm.em.flush();
  orm.em.clear();

  const b = await orm.em.findOneOrFail(Book, bookId, {
    populate: ['user', 'notes'],
  });
  expect(b.id).toBeInstanceOf(IdentityType);
  expect(b.user.id).toBeInstanceOf(IdentityType);
  expect(b.notes[0].id).toBeInstanceOf(IdentityType);
  expect(b.notes[1].id).toBeInstanceOf(IdentityType);
});
