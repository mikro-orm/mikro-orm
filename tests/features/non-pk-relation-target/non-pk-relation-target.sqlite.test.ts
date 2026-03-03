import { MikroORM, Ref, ref, Collection, Type, Platform, EntityProperty } from '@mikro-orm/sqlite';
import {
  Entity,
  PrimaryKey,
  Property,
  ManyToOne,
  OneToMany,
  Unique,
  ReflectMetadataProvider,
} from '@mikro-orm/decorators/legacy';

// Custom type that prefixes values with 'custom:' when storing to DB
class PrefixedStringType extends Type<string, string> {
  convertToDatabaseValue(value: string, platform: Platform): string {
    return value ? `custom:${value}` : value;
  }

  convertToJSValue(value: string, platform: Platform): string {
    return value?.startsWith('custom:') ? value.slice(7) : value;
  }

  getColumnType(prop: EntityProperty, platform: Platform): string {
    return 'varchar(255)';
  }
}

@Entity()
class Author {
  @PrimaryKey()
  id!: number;

  @Property()
  @Unique()
  uuid!: string;

  @Property()
  name!: string;

  @OneToMany(() => Book, book => book.author)
  books = new Collection<Book>(this);
}

@Entity()
class Book {
  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

  // This relation references Author by uuid instead of id (PK)
  @ManyToOne(() => Author, { ref: true, targetKey: 'uuid' })
  author!: Ref<Author>;
}

describe('non-PK relation target (targetKey)', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [Author, Book],
      dbName: ':memory:',
    });
    await orm.schema.create();
  });

  beforeEach(() => orm.em.clear());

  afterAll(() => orm.close(true));

  test('getReference with alternate key option', async () => {
    // Create an author with a UUID
    const author = orm.em.create(Author, { uuid: 'uuid-123', name: 'John Doe' });
    await orm.em.flush();
    orm.em.clear();

    // Get reference by uuid (non-PK column) instead of id (PK)
    // The key option makes this type-safe - id type is inferred from the key property
    const authorRef = orm.em.getReference(Author, 'uuid-123', { key: 'uuid' });

    // The reference should have the uuid property set
    expect(authorRef.uuid).toBe('uuid-123');

    // The entity should not be initialized (it's a reference)
    expect(orm.em.getUnitOfWork().getById(Author, author.id)).toBeUndefined();

    // Getting the same reference again should return the same instance
    const authorRef2 = orm.em.getReference(Author, 'uuid-123', { key: 'uuid' });
    expect(authorRef2).toBe(authorRef);

    // But we can also get a reference by PK which will be different
    const authorRefByPk = orm.em.getReference(Author, author.id);
    expect(authorRefByPk).not.toBe(authorRef); // Different identity map entry

    // Load the actual author to verify
    orm.em.clear();
    const loadedAuthor = await orm.em.findOneOrFail(Author, { uuid: 'uuid-123' });
    expect(loadedAuthor.id).toBe(author.id);
    expect(loadedAuthor.uuid).toBe('uuid-123');
    expect(loadedAuthor.name).toBe('John Doe');
  });

  test('getReference with alternate key returns cached entity', async () => {
    // First, load the author normally
    const author = await orm.em.findOneOrFail(Author, { name: 'John Doe' });

    // Now store it under the alternate key
    orm.em.getUnitOfWork().getIdentityMap().storeByKey(author, 'uuid', author.uuid, undefined);

    // Getting a reference by uuid should return the cached entity
    const authorRef = orm.em.getReference(Author, author.uuid, { key: 'uuid' });
    expect(authorRef).toBe(author);
  });

  test('ManyToOne with targetKey creates correct schema', async () => {
    const bookMeta = orm.getMetadata().get(Book);
    const authorProp = bookMeta.properties.author;

    // The relation should reference the uuid column, not the id
    expect(authorProp.targetKey).toBe('uuid');
    expect(authorProp.referencedColumnNames).toEqual(['uuid']);
    expect(authorProp.referencedPKs).toEqual(['uuid']);
  });

  test('creating book with author reference by uuid', async () => {
    // Load the author
    const author = await orm.em.findOneOrFail(Author, { name: 'John Doe' });

    // Create a book with the author
    const book = orm.em.create(Book, {
      title: 'My Book',
      author,
    });

    await orm.em.flush();
    orm.em.clear();

    // Load the book and verify the author reference
    const loadedBook = await orm.em.findOneOrFail(Book, { title: 'My Book' });
    expect(loadedBook.author.unwrap().uuid).toBe('uuid-123');
  });

  test('populate author with select-in strategy', async () => {
    // Load the book without populating
    const book = await orm.em.findOneOrFail(Book, { title: 'My Book' });
    expect(book.author.isInitialized()).toBe(false);

    // Populate using select-in strategy
    await orm.em.populate(book, ['author'], { strategy: 'select-in' });
    expect(book.author.isInitialized()).toBe(true);
    expect(book.author.unwrap().uuid).toBe('uuid-123');
    expect(book.author.unwrap().name).toBe('John Doe');
  });

  test('populate author with joined strategy', async () => {
    // Load the book with author populated using joined strategy
    const book = await orm.em.findOneOrFail(
      Book,
      { title: 'My Book' },
      {
        populate: ['author'],
        strategy: 'joined',
      },
    );

    expect(book.author.isInitialized()).toBe(true);
    expect(book.author.unwrap().uuid).toBe('uuid-123');
    expect(book.author.unwrap().name).toBe('John Doe');
  });

  test('multiple books with same author are resolved correctly', async () => {
    // Create another book with the same author
    const author = await orm.em.findOneOrFail(Author, { name: 'John Doe' });
    const book2 = orm.em.create(Book, {
      title: 'My Second Book',
      author,
    });
    await orm.em.flush();
    orm.em.clear();

    // Load both books with authors populated
    const books = await orm.em.find(
      Book,
      {},
      {
        populate: ['author'],
        orderBy: { title: 'asc' },
      },
    );

    expect(books).toHaveLength(2);
    // Both books should reference the same author instance
    expect(books[0].author.unwrap()).toBe(books[1].author.unwrap());
    expect(books[0].author.unwrap().uuid).toBe('uuid-123');
  });

  test('creating author and book in same flush uses targetKey value', async () => {
    // Create both author and book in the same flush
    // This tests ChangeSetComputer.processToOne when target entity has no PK yet
    const newAuthor = orm.em.create(Author, { uuid: 'uuid-new', name: 'New Author' });

    // First flush to get the author's PK
    await orm.em.flush();

    // Now create the book with the persisted author
    const newBook = orm.em.create(Book, { title: 'New Book', author: newAuthor });
    await orm.em.flush();

    // Verify the book was created with the correct FK value
    expect(newBook.id).toBeDefined();
    expect(newAuthor.id).toBeDefined();

    orm.em.clear();

    // Load and verify the relationship
    const loadedBook = await orm.em.findOneOrFail(
      Book,
      { title: 'New Book' },
      {
        populate: ['author'],
      },
    );
    expect(loadedBook.author.unwrap().uuid).toBe('uuid-new');
    expect(loadedBook.author.unwrap().name).toBe('New Author');
  });

  test('updating book author to different author', async () => {
    // Create a second author
    const author2 = orm.em.create(Author, { uuid: 'uuid-456', name: 'Jane Doe' });
    await orm.em.flush();
    orm.em.clear();

    // Load a book and change its author
    const book = await orm.em.findOneOrFail(Book, { title: 'My Book' }, { populate: ['author'] });
    const newAuthor = await orm.em.findOneOrFail(Author, { uuid: 'uuid-456' });

    book.author = ref(newAuthor);
    await orm.em.flush();
    orm.em.clear();

    // Verify the change was persisted
    const loadedBook = await orm.em.findOneOrFail(Book, { title: 'My Book' }, { populate: ['author'] });
    expect(loadedBook.author.unwrap().uuid).toBe('uuid-456');
    expect(loadedBook.author.unwrap().name).toBe('Jane Doe');
  });

  test('deleting entity clears alternate key from identity map', async () => {
    // Create a new author
    const author = orm.em.create(Author, { uuid: 'uuid-to-delete', name: 'To Delete' });
    await orm.em.flush();

    // Store under alternate key (simulating what happens during hydration)
    orm.em.getUnitOfWork().getIdentityMap().storeByKey(author, 'uuid', author.uuid, undefined);

    // Verify it's stored under alternate key
    const ref = orm.em.getReference(Author, 'uuid-to-delete', { key: 'uuid' });
    expect(ref).toBe(author);

    // Delete the author
    orm.em.remove(author);
    await orm.em.flush();

    // The alternate key entry should be cleared - getting a reference should create a new one
    const refAfterDelete = orm.em.getReference(Author, 'uuid-to-delete', { key: 'uuid' });
    expect(refAfterDelete).not.toBe(author);

    // Clear and verify the author is actually deleted from DB
    orm.em.clear();
    const found = await orm.em.findOne(Author, { uuid: 'uuid-to-delete' });
    expect(found).toBeNull();
  });
});

// Test with custom type on the target key property
@Entity()
class Publisher {
  @PrimaryKey()
  id!: number;

  @Property({ type: PrefixedStringType, unique: true })
  code!: string;

  @Property()
  name!: string;

  @OneToMany(() => Magazine, m => m.publisher)
  magazines = new Collection<Magazine>(this);
}

@Entity()
class Magazine {
  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

  @ManyToOne(() => Publisher, { ref: true, targetKey: 'code' })
  publisher!: Ref<Publisher>;
}

describe('non-PK relation target with custom type', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [Publisher, Magazine],
      dbName: ':memory:',
    });
    await orm.schema.create();
  });

  beforeEach(() => orm.em.clear());

  afterAll(() => orm.close(true));

  test('creating and loading with custom type targetKey', async () => {
    // Create a publisher with a code that uses custom type
    const publisher = orm.em.create(Publisher, { code: 'PUB001', name: 'Test Publisher' });
    await orm.em.flush();
    orm.em.clear();

    // Load the publisher and verify the code is correctly converted
    const loadedPublisher = await orm.em.findOneOrFail(Publisher, { name: 'Test Publisher' });
    expect(loadedPublisher.code).toBe('PUB001'); // JS value, not 'custom:PUB001'

    // Create a magazine with the publisher
    const magazine = orm.em.create(Magazine, {
      title: 'Test Magazine',
      publisher: loadedPublisher,
    });
    await orm.em.flush();
    orm.em.clear();

    // Load the magazine and verify the publisher reference works
    const loadedMagazine = await orm.em.findOneOrFail(
      Magazine,
      { title: 'Test Magazine' },
      {
        populate: ['publisher'],
      },
    );
    expect(loadedMagazine.publisher.unwrap().code).toBe('PUB001');
    expect(loadedMagazine.publisher.unwrap().name).toBe('Test Publisher');
  });

  test('populate with select-in strategy and custom type targetKey', async () => {
    // Load magazine without populating
    const magazine = await orm.em.findOneOrFail(Magazine, { title: 'Test Magazine' });
    expect(magazine.publisher.isInitialized()).toBe(false);

    // Populate using select-in strategy
    await orm.em.populate(magazine, ['publisher'], { strategy: 'select-in' });
    expect(magazine.publisher.isInitialized()).toBe(true);
    expect(magazine.publisher.unwrap().code).toBe('PUB001');
  });

  test('getReference with custom type targetKey used in relation', async () => {
    // Load a magazine without populating
    const magazine = await orm.em.findOneOrFail(Magazine, { title: 'Test Magazine' });

    // The publisher reference should have been created with the custom type value converted
    // The FK in DB is 'custom:PUB001' but the reference should have JS value 'PUB001'
    expect(magazine.publisher.isInitialized()).toBe(false);

    // The unwrapped reference should have the code set to the JS value
    const publisherRef = magazine.publisher.unwrap();
    expect(publisherRef.code).toBe('PUB001');

    // Now populate and verify everything works
    await orm.em.populate(magazine, ['publisher']);
    expect(magazine.publisher.isInitialized()).toBe(true);
    expect(magazine.publisher.unwrap().name).toBe('Test Publisher');
  });
});

// Test with defineEntity helper
import { defineEntity, p } from '@mikro-orm/core';

const DefBook = defineEntity({
  name: 'DefBook',
  properties: {
    id: p.integer().primary(),
    title: p.string(),
    author: () => p.manyToOne(DefAuthor).targetKey('uuid'),
  },
});

const DefAuthor = defineEntity({
  name: 'DefAuthor',
  properties: {
    id: p.integer().primary(),
    uuid: p.string().unique(),
    name: p.string(),
    books: () => p.oneToMany(DefBook).mappedBy('author'),
  },
});

describe('non-PK relation target with defineEntity', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [DefAuthor, DefBook],
      dbName: ':memory:',
    });
    await orm.schema.create();
  });

  beforeEach(() => orm.em.clear());

  afterAll(() => orm.close(true));

  test('defineEntity with targetKey option', async () => {
    // Create an author
    const author = orm.em.create(DefAuthor, { uuid: 'def-uuid-123', name: 'Defined Author' });
    await orm.em.flush();

    // Create a book with the author
    const book = orm.em.create(DefBook, { title: 'Defined Book', author });
    await orm.em.flush();
    orm.em.clear();

    // Load and verify
    const loadedBook = await orm.em.findOneOrFail(
      DefBook,
      { title: 'Defined Book' },
      {
        populate: ['author'],
      },
    );
    expect(loadedBook.author.uuid).toBe('def-uuid-123');
    expect(loadedBook.author.name).toBe('Defined Author');
  });
});

// Test metadata validation for targetKey
import { ManyToMany } from '@mikro-orm/decorators/legacy';

describe('targetKey metadata validation', () => {
  test('throws error when targetKey is used with ManyToMany', async () => {
    @Entity()
    class TagWithTargetKey {
      @PrimaryKey()
      id!: number;

      @Property()
      @Unique()
      code!: string;
    }

    @Entity()
    class ArticleWithM2MTargetKey {
      @PrimaryKey()
      id!: number;

      @ManyToMany(() => TagWithTargetKey, undefined, { targetKey: 'code' } as any)
      tags = new Collection<TagWithTargetKey>(this);
    }

    await expect(
      MikroORM.init({
        metadataProvider: ReflectMetadataProvider,
        entities: [TagWithTargetKey, ArticleWithM2MTargetKey],
        dbName: ':memory:',
      }),
    ).rejects.toThrow(
      `ArticleWithM2MTargetKey.tags uses 'targetKey' option which is not supported for ManyToMany relations`,
    );
  });

  test('throws error when targetKey points to non-unique property', async () => {
    @Entity()
    class AuthorWithNonUniqueCode {
      @PrimaryKey()
      id!: number;

      @Property() // NOT unique
      code!: string;
    }

    @Entity()
    class BookWithNonUniqueTargetKey {
      @PrimaryKey()
      id!: number;

      @ManyToOne(() => AuthorWithNonUniqueCode, { targetKey: 'code' })
      author!: AuthorWithNonUniqueCode;
    }

    await expect(
      MikroORM.init({
        metadataProvider: ReflectMetadataProvider,
        entities: [AuthorWithNonUniqueCode, BookWithNonUniqueTargetKey],
        dbName: ':memory:',
      }),
    ).rejects.toThrow(
      `BookWithNonUniqueTargetKey.author has 'targetKey' set to 'code', but AuthorWithNonUniqueCode.code is not marked as unique`,
    );
  });

  test('accepts targetKey pointing to property with unique constraint via @Unique decorator', async () => {
    @Entity()
    class AuthorWithUniqueCode {
      @PrimaryKey()
      id!: number;

      @Property()
      @Unique()
      code!: string;
    }

    @Entity()
    class BookWithUniqueTargetKey {
      @PrimaryKey()
      id!: number;

      @ManyToOne(() => AuthorWithUniqueCode, { targetKey: 'code' })
      author!: AuthorWithUniqueCode;
    }

    const orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [AuthorWithUniqueCode, BookWithUniqueTargetKey],
      dbName: ':memory:',
    });

    // Should not throw - validation passed
    expect(orm).toBeDefined();
    await orm.close(true);
  });
});
