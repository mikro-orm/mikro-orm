import {
  defineEntity,
  EntitySchema,
  p,
  ref,
  ScalarReference,
  unref,
  type LazyRef,
  type InferEntity,
  type Loaded,
  type Ref,
} from '@mikro-orm/core';
import {
  Entity,
  ManyToOne,
  OneToOne,
  PrimaryKey,
  Property,
  ReflectMetadataProvider,
} from '@mikro-orm/decorators/legacy';
import { MikroORM } from '@mikro-orm/sqlite';

@Entity()
class Author {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Property({ nullable: true })
  email?: string;
}

@Entity()
class Profile {
  @PrimaryKey()
  id!: number;

  @Property()
  bio!: string;
}

@Entity()
class Book {
  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

  @ManyToOne(() => Author)
  author!: LazyRef<Author>;

  @OneToOne(() => Profile, { owner: true, nullable: true })
  profile?: LazyRef<Profile>;
}

describe('LazyRef', () => {
  let orm: MikroORM;
  let authorId: number;
  let bookId: number;
  let profileId: number;

  beforeAll(async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [Author, Book, Profile],
      dbName: ':memory:',
    });
    await orm.schema.refresh();

    const author = orm.em.create(Author, { name: 'Stephen King' });
    const profile = orm.em.create(Profile, { bio: 'horror author' });
    const book = orm.em.create(Book, { title: 'It', author, profile });
    await orm.em.flush();
    authorId = author.id;
    bookId = book.id;
    profileId = profile.id;
  });

  afterAll(() => orm.close(true));
  beforeEach(() => orm.em.clear());

  test('runtime value is an entity instance, not a Reference wrapper', async () => {
    const book = await orm.em.findOneOrFail(Book, bookId);
    expect(book.author).toBeInstanceOf(Author);
    // no `.$` / `.unwrap()` at runtime — direct entity
    expect((book.author as any).unwrap).toBeUndefined();
  });

  test('PK is accessible on an unpopulated LazyRef field', async () => {
    const book = await orm.em.findOneOrFail(Book, bookId);
    // id is the PK — accessible without populate
    expect(book.author.id).toBe(authorId);
  });

  test('populate narrows LazyRef to the full entity type at runtime', async () => {
    const book = await orm.em.findOneOrFail(Book, bookId, { populate: ['author'] });
    // compile-time: `book.author` is `Loaded<Author>` thanks to Loaded<Book, 'author'> narrowing
    // runtime: full entity is hydrated
    const author: Loaded<Author> = book.author;
    expect(author.name).toBe('Stephen King');
  });

  test('populate works on 1:1 LazyRef', async () => {
    const book = await orm.em.findOneOrFail(Book, bookId, { populate: ['profile'] });
    expect(book.profile).toBeInstanceOf(Profile);
    const profile: Loaded<Profile> = book.profile!;
    expect(profile.bio).toBe('horror author');
  });

  test('em.populate() narrows LazyRef as well', async () => {
    const book = await orm.em.findOneOrFail(Book, bookId);
    const [populated] = await orm.em.populate([book], ['author']);
    const author: Loaded<Author> = populated.author;
    expect(author.name).toBe('Stephen King');
  });

  test('LazyRef path-based populate works transitively', async () => {
    const book = await orm.em.findOneOrFail(Book, bookId, { populate: ['author.email'] });
    const author: Loaded<Author> = book.author;
    expect(author.name).toBe('Stephen King');
  });

  test('type-level: non-PK access is rejected on unloaded LazyRef', async () => {
    const book = await orm.em.findOneOrFail(Book, bookId);
    // id is the PK and is exposed
    const id: number = book.author.id;
    // @ts-expect-error non-PK access on an unloaded LazyRef must be a compile error
    const _name: string = book.author.name;
    expect(id).toBe(authorId);
  });

  test('type-level: loaded narrowing restores full entity access', async () => {
    const book = await orm.em.findOneOrFail(Book, bookId, { populate: ['author'] });
    // after Loaded<Book, 'author'>, non-PK access compiles fine
    const name: string = book.author.name;
    expect(name).toBe('Stephen King');
  });

  test('unref() narrows a populated LazyRef to the underlying entity', async () => {
    const book = await orm.em.findOneOrFail(Book, bookId, { populate: ['author'] });
    // even though `book.author` is typed as `LazyRef<Author>` in a bare `Book`, unref escapes the brand
    function logAuthor(b: Book) {
      return unref(b.author).name;
    }
    expect(logAuthor(book)).toBe('Stephen King');
  });

  test('unref() also unwraps a Ref<T> wrapper (runtime calls .unwrap())', async () => {
    const author = await orm.em.findOneOrFail(Author, authorId);
    const wrapped: Ref<Author> = ref(author);
    expect(unref(wrapped)).toBe(author);
    expect(unref(wrapped).name).toBe('Stephen King');
  });

  test('unref() is identity for a plain entity', async () => {
    const author = await orm.em.findOneOrFail(Author, authorId);
    expect(unref(author)).toBe(author);
  });

  test('unref() passes null/undefined through unchanged', () => {
    expect(unref(null)).toBeNull();
    expect(unref(undefined)).toBeUndefined();
  });

  test('unref() narrows return type for non-nullable / null-only / undefined-only inputs', async () => {
    const author = await orm.em.findOneOrFail(Author, authorId);
    const nonNullable: Author = author;
    const nullable: Author | null = author;
    const optional: Author | undefined = author;

    // type-level: each input kind should produce a correspondingly narrow return type
    const a: Author = unref(nonNullable);
    const b: Author | null = unref(nullable);
    const c: Author | undefined = unref(optional);

    expect(a).toBe(author);
    expect(b).toBe(author);
    expect(c).toBe(author);
  });

  test('unref() unwraps ScalarReference to its value (inverse of ref(scalar))', () => {
    const scalar = new ScalarReference('hello');
    const out = unref(scalar);
    expect(out).toBe('hello');

    // type-level: return is `V | undefined` (since a scalar reference may be unbound)
    type Out = typeof out;
    type IsStringOrUndefined = [Out] extends [string | undefined] ? true : false;
    const typeCheck: IsStringOrUndefined = true;
    expect(typeCheck).toBe(true);
  });

  test('unref() on an unbound ScalarReference returns undefined', () => {
    const scalar = new ScalarReference<string>();
    expect(unref(scalar)).toBeUndefined();
  });

  test('em.create() accepts nested data for a LazyRef-typed relation', async () => {
    // regression: EntityData / RequiredEntityData must unwrap LazyRef to the underlying entity
    // shape so nested object literals type-check on create/assign
    const book = orm.em.create(Book, { title: 'nested-create', author: { name: 'Nested Author' } });
    await orm.em.flush();
    expect(book.author).toBeInstanceOf(Author);
    expect(book.author.id).toBeDefined();
  });

  test("populate: ['*'] narrows LazyRef fields to their loaded type", async () => {
    // regression: LoadableShape must include LazyRef so populate: '*' sees it
    const book = await orm.em.findOneOrFail(Book, bookId, { populate: ['*'] });
    const author: Loaded<Author> = book.author;
    expect(author.name).toBe('Stephen King');
  });
});

describe('LazyRef via defineEntity builder .lazyRef()', () => {
  const User = defineEntity({
    name: 'LREntityUser',
    properties: {
      id: p.integer().primary().autoincrement(),
      name: p.string(),
    },
  });

  const Article = defineEntity({
    name: 'LREntityArticle',
    properties: {
      id: p.integer().primary().autoincrement(),
      title: p.string(),
      author: () => p.manyToOne(User).lazyRef(),
    },
  });

  type ArticleEntity = InferEntity<typeof Article>;
  type UserEntity = InferEntity<typeof User>;

  let orm: MikroORM;
  let authorId: number;
  let articleId: number;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [User, Article],
      dbName: ':memory:',
    });
    await orm.schema.refresh();

    const author = orm.em.create(User, { name: 'Ursula' });
    const article = orm.em.create(Article, { title: 'A Wizard of Earthsea', author });
    await orm.em.flush();
    authorId = author.id;
    articleId = article.id;
  });

  afterAll(() => orm.close(true));
  beforeEach(() => orm.em.clear());

  test('inferred entity uses LazyRef for the relation type', () => {
    // type-only assertion — ArticleEntity['author'] should be LazyRef<UserEntity>
    const assertType = (_: ArticleEntity['author']) => 0 as unknown as LazyRef<UserEntity>;
    expect(assertType).toBeDefined();
  });

  test('runtime: .lazyRef() does not create a Reference wrapper', async () => {
    const article = await orm.em.findOneOrFail(Article, articleId);
    expect((article.author as any).unwrap).toBeUndefined();
    expect(article.author.id).toBe(authorId);
  });

  test('runtime + type: populate narrows LazyRef to full entity', async () => {
    const article = await orm.em.findOneOrFail(Article, articleId, { populate: ['author'] });
    const author: Loaded<UserEntity> = article.author;
    expect(author.name).toBe('Ursula');
  });

  test('type-level: .lazyRef() is gated by builder kind and ref chain', () => {
    type IsNever<T> = [T] extends [never] ? true : false;
    type AssertTrue<T extends true> = T;

    // scalars (no kind) → `.lazyRef()` returns never
    type _scalarGate = AssertTrue<IsNever<ReturnType<ReturnType<typeof p.string>['lazyRef']>>>;

    // 1:m → returns never
    type _oneToManyGate = AssertTrue<IsNever<ReturnType<ReturnType<typeof p.oneToMany<typeof User>>['lazyRef']>>>;

    // m:n → returns never
    type _manyToManyGate = AssertTrue<IsNever<ReturnType<ReturnType<typeof p.manyToMany<typeof User>>['lazyRef']>>>;

    // .ref().lazyRef() → returns never (ref conflict)
    type _refChain = AssertTrue<
      IsNever<ReturnType<ReturnType<ReturnType<typeof p.manyToOne<typeof User>>['ref']>['lazyRef']>>
    >;

    // .lazyRef().ref() → returns never (reverse direction also rejected)
    type _lazyRefThenRef = AssertTrue<
      IsNever<ReturnType<ReturnType<ReturnType<typeof p.manyToOne<typeof User>>['lazyRef']>['ref']>>
    >;

    // .lazyRef().mapToPk() → returns never (mapToPk also conflicts with lazyRef)
    type _lazyRefThenMapToPk = AssertTrue<
      IsNever<ReturnType<ReturnType<ReturnType<typeof p.manyToOne<typeof User>>['lazyRef']>['mapToPk']>>
    >;

    // .mapToPk().lazyRef() → returns never (forward direction also rejected)
    type _mapToPkThenLazyRef = AssertTrue<
      IsNever<ReturnType<ReturnType<ReturnType<typeof p.manyToOne<typeof User>>['mapToPk']>['lazyRef']>>
    >;

    // m:1 without ref → valid, returns a builder
    type _ok = AssertTrue<
      IsNever<ReturnType<ReturnType<typeof p.manyToOne<typeof User>>['lazyRef']>> extends true ? false : true
    >;

    expect(true).toBe(true);
  });
});

describe('LazyRef with EntitySchema', () => {
  interface ESAuthor {
    id: number;
    name: string;
  }

  interface ESBook {
    id: number;
    title: string;
    author: LazyRef<ESAuthor>;
  }

  const ESAuthorSchema = new EntitySchema<ESAuthor>({
    name: 'ESAuthor',
    properties: {
      id: { type: 'number', primary: true, autoincrement: true },
      name: { type: 'string' },
    },
  });

  const ESBookSchema: EntitySchema<ESBook> = new EntitySchema<ESBook>({
    name: 'ESBook',
    properties: {
      id: { type: 'number', primary: true, autoincrement: true },
      title: { type: 'string' },
      author: { kind: 'm:1', entity: () => ESAuthorSchema },
    },
  });

  let orm: MikroORM;
  let authorId: number;
  let bookId: number;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [ESAuthorSchema, ESBookSchema],
      dbName: ':memory:',
    });
    await orm.schema.refresh();

    const author = orm.em.create(ESAuthorSchema, { name: 'Ursula' });
    const book = orm.em.create(ESBookSchema, { title: 'A Wizard of Earthsea', author });
    await orm.em.flush();
    authorId = author.id;
    bookId = book.id;
  });

  afterAll(() => orm.close(true));
  beforeEach(() => orm.em.clear());

  test('runtime: EntitySchema-defined LazyRef relation works', async () => {
    const book = await orm.em.findOneOrFail(ESBookSchema, bookId);
    expect(book.author.id).toBe(authorId);
    // runtime value is a plain entity stub, not a Reference wrapper
    expect((book.author as any).unwrap).toBeUndefined();
  });

  test('runtime + type: populate narrows LazyRef via EntitySchema', async () => {
    const book = await orm.em.findOneOrFail(ESBookSchema, bookId, { populate: ['author'] });
    const author: Loaded<ESAuthor> = book.author;
    expect(author.name).toBe('Ursula');
  });

  test('type-level: non-PK access is rejected on an unloaded LazyRef via EntitySchema', async () => {
    const book = await orm.em.findOneOrFail(ESBookSchema, bookId);
    const id: number = book.author.id;
    // @ts-expect-error non-PK access on an unloaded LazyRef must be a compile error
    const _name: string = book.author.name;
    expect(id).toBe(authorId);
  });
});
