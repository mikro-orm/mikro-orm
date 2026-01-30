import { Collection, MikroORM, Opt, OptionalProps, quote, Ref } from '@mikro-orm/postgresql';
import { Check, Entity, Formula, ManyToOne, OneToMany, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { vi } from 'vitest';

@Entity({ schema: '*' })
class User {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Property({ unique: true })
  email!: string;

  @Formula(
    (_cols, table) => `(select ${table.schema}.user.id from ${table.schema}.user where ${table.alias}.id = 1)`,
    { lazy: true },
  )
  baz?: string;

  @Formula(
    (cols, table) => quote`(select ${cols.id} from ${table.qualifiedName} where ${cols.id} = 1)`,
    { lazy: true },
  )
  baz2?: string;

}

// Entities for testing formula with quote in joins
@Entity()
class Author7102 {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @OneToMany(() => Book7102, book => book.author)
  books = new Collection<Book7102>(this);

}

@Entity()
class Book7102 {

  [OptionalProps]?: 'priceTaxed';

  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

  @Property({ type: 'decimal', precision: 8, scale: 2 })
  price!: string;

  // Non-lazy formula with quote helper - uses table.toString() to cover that code path
  @Formula((cols, table) => quote`${cols.price} * 1.19 /* ${table} */`)
  priceTaxed?: string;

  // Lazy formula that uses table.toString() to cover buildFields code path (line 2009)
  @Formula((cols, table) => quote`${cols.price} * 1.21 /* ${table} */`, { lazy: true })
  priceTaxedLazy?: string;

  @ManyToOne(() => Author7102, { ref: true })
  author!: Ref<Author7102>;

}

// Entities for testing generated column with quote helper
// Check constraint uses table.toString() to cover that code path in MetadataDiscovery
@Entity()
@Check({ expression: (cols, table) => `${cols.firstName} is not null /* ${table} */` })
class Product7102 {

  @PrimaryKey()
  id!: number;

  @Property()
  firstName!: string;

  @Property()
  lastName!: string;

  // Generated column with quote helper returning Raw - uses table.toString() to cover that code path
  @Property({
    length: 100,
    generated: (cols, table) => quote`(${cols.firstName} || ' ' || ${cols.lastName} || ' from ' || '${table}') stored`,
  })
  fullName!: Opt<string>;

}

let orm: MikroORM;
let orm2: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: 'mikro_orm_test_gh_7102',
    entities: [User],
  });
  orm2 = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: 'mikro_orm_test_gh_7102_2',
    entities: [Author7102, Book7102, Product7102],
  });
});

afterAll(async () => {
  await orm.close(true);
  await orm2.close(true);
});

test('formula should support a schema parameter', async () => {
  const em = orm.em.fork({ schema: 'theSpecificSchema' });
  const qb = em.createQueryBuilder(User).select(['name', 'baz', 'baz2']);
  const sql = qb.getFormattedQuery();

  // Schema should be present in the formula (not undefined)
  expect(sql).not.toContain('undefined');
  expect(sql).toContain('theSpecificSchema.user.id');
  expect(sql).toContain('select "u0"."id" from "theSpecificSchema"."user" where "u0"."id" = 1');
});

test('formula with quote helper should work with joins', async () => {
  const qb = orm2.em.createQueryBuilder(Author7102)
    .select('*')
    .leftJoinAndSelect('books', 'b');
  const sql = qb.getFormattedQuery();

  // Formula should be properly quoted (priceTaxed formula)
  expect(sql).toContain('"b"."price" * 1.19');
});

test('formula with quote helper should work when querying directly', async () => {
  const qb = orm2.em.createQueryBuilder(Book7102).select('*');
  const sql = qb.getFormattedQuery();

  // Formula should use quoted column reference
  expect(sql).toContain('"b0"."price" * 1.19');
});

test('generated column with quote helper should produce correct schema', async () => {
  const createSQL = await orm2.schema.getCreateSchemaSQL({ wrap: false });

  // Generated column SQL should have properly quoted identifiers and include table name from toString()
  // The quote helper quotes the table name as an identifier
  expect(createSQL).toContain('"first_name" || \' \' || "last_name" || \' from \' || \'"product7102"\'');
});

test('formula with quote helper should work with em.find (buildFields path)', async () => {
  // This tests AbstractSqlDriver.buildFields which processes lazy formulas
  // Lazy formulas trigger the addFormulas code path in buildFields (line 2009)
  const mock = vi.fn();
  const em = orm2.em.fork();
  em.getConnection().execute = mock;

  try {
    // Request the lazy formula field to trigger buildFields formula processing
    await em.find(Book7102, {}, { populate: ['priceTaxedLazy'] });
  } catch {
    // Expected to fail since we mock execute, but we just need to check the SQL
  }

  expect(mock).toHaveBeenCalled();
  const sql = mock.mock.calls[0][0];
  // Lazy formula should be properly quoted in the SQL and include table.toString() result
  expect(sql).toContain('"b0"."price" * 1.21');
});

test('formula with quote helper should work with em.find and joined strategy (mapPropToFieldNames path)', async () => {
  // This tests AbstractSqlDriver.mapPropToFieldNames which processes formulas during joined loading
  const mock = vi.fn();
  const em = orm2.em.fork();
  em.getConnection().execute = mock;

  try {
    await em.find(Author7102, {}, { populate: ['books'], strategy: 'joined' });
  } catch {
    // Expected to fail since we mock execute, but we just need to check the SQL
  }

  expect(mock).toHaveBeenCalled();
  const sql = mock.mock.calls[0][0];
  // Formula should be properly quoted in the SQL for joined loading
  expect(sql).toContain('"price" * 1.19');
});
