import {
  MikroORM,
  defineEntity,
  p,
  Type,
  EntityProperty,
  ValidationError,
  wrap,
} from '@mikro-orm/postgresql';

// Custom type that stores numbers as strings in the database
class DecimalType extends Type<number | null, string | null> {

  convertToDatabaseValue(value: number | null): string | null {
    if (value == null) {
      return null;
    }
    if (!Number.isFinite(value) || isNaN(+value)) {
      throw ValidationError.invalidType(DecimalType, value, 'JS');
    }
    return value.toString();
  }

  convertToJSValue(value: string | null): number | null {
    if (value == null) {
      return null;
    }
    if (typeof value !== 'string') {
      throw ValidationError.invalidType(DecimalType, value, 'database');
    }
    return parseFloat(value);
  }

  compareAsType(): string {
    return 'number';
  }

  getColumnType(prop: EntityProperty): string {
    if (prop.precision && prop.scale) {
      return `numeric(${prop.precision}, ${prop.scale})`;
    }
    return 'numeric';
  }

}

const Publisher = defineEntity({
  name: 'Publisher',
  properties: {
    id: p.integer().primary(),
    name: p.string(),
  },
});

const Book = defineEntity({
  name: 'Book',
  properties: {
    id: p.integer().primary(),
    title: p.string(),
    price: p.type(DecimalType).precision(10).scale(2),
    publisher: () => p.manyToOne(Publisher),
  },
});

const Author = defineEntity({
  name: 'Author',
  properties: {
    id: p.integer().primary(),
    name: p.string(),
    favoriteBook: () => p.manyToOne(Book).nullable(),
  },
});

describe('em.refresh() with custom types', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Author, Book, Publisher],
    });

    await orm.schema.refreshDatabase();
  });

  afterAll(() => orm.close(true));
  beforeEach(async () => {
    await orm.schema.clearDatabase();
  });

  test('em.refresh() correctly converts custom type from database', async () => {
    // Setup: Create a book with a price using custom DecimalType
    const publisher = orm.em.create(Publisher, { name: 'Tech Books Inc' });
    const book = orm.em.create(Book, {
      title: 'Learning MikroORM',
      price: 29.99,
      publisher,
    });
    await orm.em.flush();
    const bookId = book.id;
    orm.em.clear();

    // Load the book
    const loadedBook = await orm.em.findOneOrFail(Book, bookId);
    expect(loadedBook.price).toBe(29.99);
    expect(typeof loadedBook.price).toBe('number');

    wrap(loadedBook).assign({ price: 16.50 });
    await orm.em.flush();

    // refresh should now properly convert through custom type
    await orm.em.refresh(loadedBook);
    expect(loadedBook.price).toBe(16.5);
    expect(typeof loadedBook.price).toBe('number');
  });

  test('workaround: em.findOne() properly converts custom type', async () => {
    // Setup: Create a book with a price using custom DecimalType
    const publisher = orm.em.create(Publisher, { name: 'Tech Books Inc' });
    const book = orm.em.create(Book, {
      title: 'Learning MikroORM',
      price: 29.99,
      publisher,
    });
    await orm.em.flush();
    const bookId = book.id;
    orm.em.clear();

    // Load the book
    const loadedBook = await orm.em.findOneOrFail(Book, bookId);
    expect(loadedBook.price).toBe(29.99);
    expect(typeof loadedBook.price).toBe('number');

    wrap(loadedBook).assign({ price: 16.50 });
    await orm.em.flush();
    orm.em.clear();

    // Using findOne works correctly - it properly converts through custom type
    const refreshedBook = await orm.em.findOneOrFail(Book, bookId);
    expect(refreshedBook.price).toBe(16.5);
    expect(typeof refreshedBook.price).toBe('number');
  });
});
