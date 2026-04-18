import { BaseEntity, Loadable, LoadableBaseEntity, NotFoundError, ref, type Ref } from '@mikro-orm/core';
import { Entity, ManyToOne, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { MikroORM } from '@mikro-orm/sqlite';

@Entity()
class Author extends LoadableBaseEntity {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;
}

@Entity()
class Book extends LoadableBaseEntity {
  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

  @ManyToOne(() => Author, { ref: true })
  author!: Ref<Author>;
}

// verify the mixin form also works when used directly on a plain class that does not extend BaseEntity
class PlainBase {}
@Entity()
class Tag extends Loadable(PlainBase) {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;
}

// verify the zero-argument form works as a standalone base (no other inheritance)
@Entity()
class Category extends Loadable() {
  @PrimaryKey()
  id!: number;

  @Property()
  label!: string;
}

describe('Loadable mixin', () => {
  let orm: MikroORM;
  let authorId: number;
  let bookId: number;
  let tagId: number;
  let categoryId: number;

  beforeAll(async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [Author, Book, Tag, Category],
      dbName: ':memory:',
    });
    await orm.schema.refresh();

    const author = orm.em.create(Author, { name: 'Stephen King' });
    const book = orm.em.create(Book, { title: 'It', author });
    const tag = orm.em.create(Tag, { name: 'horror' });
    const category = orm.em.create(Category, { label: 'fiction' });
    await orm.em.flush();
    authorId = author.id;
    bookId = book.id;
    tagId = tag.id;
    categoryId = category.id;
  });

  afterAll(() => orm.close(true));
  beforeEach(() => orm.em.clear());

  test('load() returns the same instance when already initialized', async () => {
    const author = await orm.em.findOneOrFail(Author, authorId);
    const loaded = await author.load();
    expect(loaded).toBe(author);
    expect(loaded!.name).toBe('Stephen King');
  });

  test('load() hydrates an uninitialized entity reference', async () => {
    const naked = orm.em.getReference(Author, authorId);
    expect(naked.isInitialized()).toBe(false);

    const loaded = await naked.load();
    expect(loaded).toBe(naked);
    expect(naked.isInitialized()).toBe(true);
    expect(loaded!.name).toBe('Stephen King');
  });

  test('load() returns null when the entity is missing in the database', async () => {
    const naked = orm.em.getReference(Author, 999_999);
    const loaded = await naked.load();
    expect(loaded).toBeNull();
  });

  test('load() can populate a relation on an already loaded entity', async () => {
    const book = await orm.em.findOneOrFail(Book, bookId);
    expect(book.author.isInitialized()).toBe(false);

    const loaded = await book.load({ populate: ['author'] });
    expect(loaded).toBe(book);
    expect(book.author.isInitialized()).toBe(true);
    expect(loaded!.author.$.name).toBe('Stephen King');
  });

  test('load({ refresh: true }) reloads even when already initialized', async () => {
    const author = await orm.em.findOneOrFail(Author, authorId);
    author.name = 'mutated locally';

    const reloaded = await author.load({ refresh: true });
    expect(reloaded).toBe(author);
    expect(author.name).toBe('Stephen King');
  });

  test('loadOrFail() returns the entity when found', async () => {
    const naked = orm.em.getReference(Author, authorId);
    const loaded = await naked.loadOrFail();
    expect(loaded).toBe(naked);
    expect(loaded.name).toBe('Stephen King');
  });

  test('loadOrFail() throws NotFoundError when the entity is missing', async () => {
    const naked = orm.em.getReference(Author, 999_999);
    await expect(naked.loadOrFail()).rejects.toThrow(NotFoundError);
  });

  test('loadOrFail() honors a custom failHandler', async () => {
    const naked = orm.em.getReference(Author, 999_999);
    await expect(naked.loadOrFail({ failHandler: name => new Error(`missing ${name}`) })).rejects.toThrow(
      'missing Author',
    );
  });

  test('load() works on a Reference wrapper as well (regression for shared codepath)', async () => {
    const author = await orm.em.findOneOrFail(Author, authorId);
    const wrapped = ref(author);
    const loaded = await wrapped.load();
    expect(loaded).toBe(author);
  });

  test('Loadable(PlainBase) works without BaseEntity', async () => {
    const naked = orm.em.getReference(Tag, tagId);
    expect(naked).toBeInstanceOf(Tag);

    const loaded = await naked.loadOrFail();
    expect(loaded).toBe(naked);
    expect(loaded.name).toBe('horror');
  });

  test('Loadable() (no argument) works as a standalone base', async () => {
    const naked = orm.em.getReference(Category, categoryId);
    expect(naked).toBeInstanceOf(Category);

    const loaded = await naked.loadOrFail();
    expect(loaded).toBe(naked);
    expect(loaded.label).toBe('fiction');
  });

  test('BaseEntity (without mixin) does not expose load/loadOrFail', () => {
    // sanity: BaseEntity itself must remain clean to preserve non-breaking guarantee
    expect((BaseEntity.prototype as any).load).toBeUndefined();
    expect((BaseEntity.prototype as any).loadOrFail).toBeUndefined();
  });

  test('type-level: Loadable() rejects a base class that already defines `load` or `loadOrFail`', () => {
    class HasLoad {
      async load() {
        return 'custom';
      }
    }
    class HasLoadOrFail {
      async loadOrFail() {
        return 'custom';
      }
    }

    // @ts-expect-error Loadable must reject a base with an existing `load` method
    Loadable(HasLoad);
    // @ts-expect-error Loadable must reject a base with an existing `loadOrFail` method
    Loadable(HasLoadOrFail);

    expect(true).toBe(true);
  });
});
