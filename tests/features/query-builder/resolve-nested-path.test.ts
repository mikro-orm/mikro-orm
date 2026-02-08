import { Collection, MikroORM, Ref, raw } from '@mikro-orm/sqlite';
import {
  Embeddable,
  Embedded,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryKey,
  Property,
  ReflectMetadataProvider,
} from '@mikro-orm/decorators/legacy';

@Embeddable()
class Address {
  @Property()
  street!: string;

  @Property()
  city!: string;
}

@Embeddable()
class Profile {
  @Property()
  bio!: string;

  @Embedded(() => Address)
  address = new Address();
}

@Entity()
class Author {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Embedded(() => Profile)
  profile = new Profile();

  @Embedded(() => Address, { object: true })
  objectAddress?: Address;

  @OneToMany(() => Book, book => book.author)
  books = new Collection<Book>(this);
}

@Entity()
class Book {
  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

  @ManyToOne(() => Author)
  author!: Ref<Author>;

  @ManyToOne(() => Publisher, { nullable: true })
  publisher?: Ref<Publisher>;
}

@Entity()
class Publisher {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: ':memory:',
    entities: [Author, Book, Publisher],
  });
  await orm.schema.refresh();
});

afterAll(async () => {
  await orm.close(true);
});

describe('resolveNestedPath', () => {
  test('simple field with existing alias', async () => {
    const qb = orm.em.qb(Author, 'a').select(['a.id', 'a.name']);
    expect(qb.getFormattedQuery()).toBe('select `a`.`id`, `a`.`name` from `author` as `a`');
  });

  test('property without alias prefix uses main entity', async () => {
    const qb = orm.em.qb(Author).select(['id', 'name']);
    expect(qb.getFormattedQuery()).toBe('select `a0`.`id`, `a0`.`name` from `author` as `a0`');
  });

  test('flattened embedded - select whole embedded returns all fields', async () => {
    const qb = orm.em.qb(Author, 'a').select(['a.id', 'a.profile']);
    expect(qb.getFormattedQuery()).toBe(
      'select `a`.`id`, `a`.`profile_bio`, `a`.`profile_address_street`, `a`.`profile_address_city` from `author` as `a`',
    );
  });

  test('flattened embedded - select nested property', async () => {
    const qb = orm.em.qb(Author, 'a').select(['a.id', 'a.profile.bio']);
    expect(qb.getFormattedQuery()).toBe('select `a`.`id`, `a`.`profile_bio` from `author` as `a`');
  });

  test('flattened embedded - select deeply nested property', async () => {
    const qb = orm.em.qb(Author, 'a').select(['a.id', 'a.profile.address.city']);
    expect(qb.getFormattedQuery()).toBe('select `a`.`id`, `a`.`profile_address_city` from `author` as `a`');
  });

  test('object embedded - select whole embedded returns json column', async () => {
    const qb = orm.em.qb(Author, 'a').select(['a.id', 'a.objectAddress']);
    expect(qb.getFormattedQuery()).toBe('select `a`.`id`, `a`.`object_address` from `author` as `a`');
  });

  test('object embedded - select nested path returns json column (object mode)', async () => {
    // For object embeddables, selecting nested paths still returns the whole json column
    // because individual fields aren't stored separately - resolveNestedPath detects object
    // embedded and returns just the parent property
    const qb = orm.em.qb(Author).select(['id', 'objectAddress.city']);
    expect(qb.getFormattedQuery()).toBe('select `a0`.`id`, `a0`.`object_address` from `author` as `a0`');
  });

  test('relation - select just the relation returns join column', async () => {
    const qb = orm.em.qb(Book, 'b').select(['b.id', 'b.author']);
    expect(qb.getFormattedQuery()).toBe('select `b`.`id`, `b`.`author_id` from `book` as `b`');
  });

  test('relation - navigate through relation with auto-join', async () => {
    const qb = orm.em.qb(Book, 'b').select(['b.id', 'b.author.name']);
    expect(qb.getFormattedQuery()).toMatch(
      /select `b`.`id`, `a\d+`.`name` from `book` as `b` left join `author` as `a\d+` on `b`.`author_id` = `a\d+`.`id`/,
    );
  });

  test('relation - navigate through multiple relations', async () => {
    const qb = orm.em.qb(Author, 'a').select(['a.id', 'a.books.publisher.name']);
    // Should auto-join both books and publisher
    expect(qb.getFormattedQuery()).toMatch(/left join `book` as `b\d+`/);
    expect(qb.getFormattedQuery()).toMatch(/left join `publisher` as `p\d+`/);
  });

  test('groupBy with nested path', async () => {
    const qb = orm.em
      .qb(Book, 'b')
      .join('b.author', 'author')
      .select(['author.name', raw('count(b.id) as book_count')])
      .groupBy('author.name');
    expect(qb.getFormattedQuery()).toMatch(/group by `author`.`name`/);
  });

  test('groupBy with flattened embedded path', async () => {
    const qb = orm.em
      .qb(Author, 'a')
      .select(['a.profile.address.city'])
      .addSelect(raw('count(a.id) as author_count'))
      .groupBy('a.profile.address.city');
    expect(qb.getFormattedQuery()).toMatch(/group by `a`.`profile_address_city`/);
  });

  test('existing join is reused - simple alias reference', async () => {
    // Join added before select, then reference by alias
    const qb = orm.em.qb(Book, 'b').join('b.author', 'author').select(['b.id', 'author.name']);
    // Should use the existing join alias
    expect(qb.getFormattedQuery()).toBe(
      'select `b`.`id`, `author`.`name` from `book` as `b` inner join `author` as `author` on `b`.`author_id` = `author`.`id`',
    );
  });

  test('existing join is reused - via path resolution', async () => {
    // Join added before select, then use full path that resolves to same join
    const qb = orm.em.qb(Author, 'a').join('a.books', 'b').select(['a.id', 'a.books.title']);
    // Should reuse the existing 'b' join, not create a new one
    expect(qb.getFormattedQuery()).toBe(
      'select `a`.`id`, `b`.`title` from `author` as `a` inner join `book` as `b` on `a`.`id` = `b`.`author_id`',
    );
  });

  test('nested embedded in auto-joined relation', async () => {
    const qb = orm.em.qb(Book, 'b').select(['b.id', 'b.author.profile.bio']);
    expect(qb.getFormattedQuery()).toMatch(/`a\d+`.`profile_bio`/);
  });

  test('unresolvable path returns as-is', async () => {
    // When a property doesn't exist, it should return the field unchanged
    // Using type assertion since we're intentionally testing invalid paths
    const qb = orm.em.qb(Author, 'a').select(['a.id', 'a.nonexistent.field'] as const as any);
    // The field should be passed through (may cause SQL error but that's expected)
    expect(qb.getFormattedQuery()).toContain('nonexistent.field');
  });

  test('embedded property without alias prefix', async () => {
    // Test selecting embedded path without alias - prepends main alias
    const qb = orm.em.qb(Author).select(['id', 'profile.bio']);
    expect(qb.getFormattedQuery()).toBe('select `a0`.`id`, `a0`.`profile_bio` from `author` as `a0`');
  });

  test('relation at end of multi-level path', async () => {
    // Test selecting a relation as the final part of a path (returns FK column)
    const qb = orm.em.qb(Author, 'a').select(['a.id', 'a.books.publisher']);
    // Should auto-join books and return publisher FK column
    expect(qb.getFormattedQuery()).toMatch(/left join `book` as `b\d+`/);
    expect(qb.getFormattedQuery()).toMatch(/`b\d+`.`publisher_id`/);
  });

  test('scalar property without alias prefix', async () => {
    // Test navigating into scalar from root without alias
    const qb = orm.em.qb(Book).select(['id', 'title']);
    expect(qb.getFormattedQuery()).toBe('select `b0`.`id`, `b0`.`title` from `book` as `b0`');
  });

  test('where with flattened embedded path', async () => {
    // Test filtering by embedded property - use nested object syntax (same as relations)
    const qb = orm.em
      .qb(Author, 'a')
      .select('a.id')
      .where({ profile: { bio: 'test' } });
    expect(qb.getFormattedQuery()).toBe("select `a`.`id` from `author` as `a` where `a`.`profile_bio` = 'test'");
  });

  test('where with object embedded', async () => {
    // Test filtering by object embedded
    const qb = orm.em
      .qb(Author, 'a')
      .select('a.id')
      .where({ objectAddress: { street: 'Main' } });
    expect(qb.getFormattedQuery()).toMatch(/where.*object_address/);
  });

  test('orderBy with embedded path (nested object)', async () => {
    // Test ordering by embedded property using nested object syntax
    const qb = orm.em
      .qb(Author, 'a')
      .select('a.id')
      .orderBy({ profile: { bio: 'asc' } });
    expect(qb.getFormattedQuery()).toBe('select `a`.`id` from `author` as `a` order by `a`.`profile_bio` asc');
  });

  test('orderBy with embedded path (dot notation)', async () => {
    // Test ordering by embedded property using dot notation
    const qb = orm.em.qb(Author, 'a').select('a.id').orderBy({ 'profile.bio': 'asc' });
    expect(qb.getFormattedQuery()).toBe('select `a`.`id` from `author` as `a` order by `a`.`profile_bio` asc');
  });

  test('groupBy with raw fragment', async () => {
    // Test groupBy with non-string field (RawQueryFragment)
    const qb = orm.em
      .qb(Author, 'a')
      .select([raw('count(*) as cnt')])
      .groupBy([raw('1')]);
    expect(qb.getFormattedQuery()).toBe('select count(*) as cnt from `author` as `a` group by 1');
  });
});
