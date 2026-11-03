import { defineEntity, p } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/pglite';
import { Entity, Index, PrimaryKey, Property, ReflectMetadataProvider, Unique } from '@mikro-orm/decorators/legacy';

@Entity()
class Book {
  @PrimaryKey({ type: 'number' })
  id!: number;

  @Index({ name: 'book_created_at_idx', columns: [{ name: 'createdAt', sort: 'DESC' }] })
  @Property({ type: 'Date' })
  createdAt!: Date;

  @Index({ name: 'book_title_idx', include: ['createdAt'] })
  @Property({ type: 'string' })
  title!: string;

  @Unique({ name: 'book_isbn_unique', deferMode: 'deferred' })
  @Property({ type: 'string' })
  isbn!: string;

  @Index({ name: 'book_author_idx' })
  @Property({ type: 'string' })
  author!: string;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: 'memory://',
    entities: [Book],
    metadataProvider: ReflectMetadataProvider,
  });
  await orm.schema.create();
});

afterAll(async () => {
  await orm.close(true);
});

test('GH #8488: property-level index keeps its options', async () => {
  const indexes = await orm.em.execute<{ indexdef: string }[]>(
    `select indexdef from pg_indexes where tablename = 'book' and indexname <> 'book_pkey' order by indexname`,
  );
  expect(indexes.map(i => i.indexdef)).toEqual([
    'CREATE INDEX book_author_idx ON public.book USING btree (author)',
    'CREATE INDEX book_created_at_idx ON public.book USING btree (created_at DESC)',
    'CREATE UNIQUE INDEX book_isbn_unique ON public.book USING btree (isbn)',
    'CREATE INDEX book_title_idx ON public.book USING btree (title) INCLUDE (created_at)',
  ]);

  const [isbn] = await orm.em.execute<{ condeferred: boolean }[]>(
    `select condeferred from pg_constraint where conname = 'book_isbn_unique'`,
  );
  expect(isbn.condeferred).toBe(true);

  // a plain named index is still folded into the property
  expect(orm.getMetadata().get(Book).properties.author.index).toBe('book_author_idx');

  await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');
});

test('GH #8488: single-property index keeps its options with defineEntity', async () => {
  const Article = defineEntity({
    name: 'Article',
    properties: {
      id: p.integer().primary(),
      createdAt: p.datetime(),
      slug: p.string(),
    },
    indexes: [
      { properties: 'createdAt', name: 'article_created_at_idx', columns: [{ name: 'createdAt', sort: 'DESC' }] },
    ],
    uniques: [{ properties: 'slug', name: 'article_slug_unique', deferMode: 'deferred' }],
  });

  const orm2 = await MikroORM.init({ dbName: 'memory://', entities: [Article] });
  await orm2.schema.create();

  const indexes = await orm2.em.execute<{ indexdef: string }[]>(
    `select indexdef from pg_indexes where indexname = 'article_created_at_idx'`,
  );
  expect(indexes.map(i => i.indexdef)).toEqual([
    'CREATE INDEX article_created_at_idx ON public.article USING btree (created_at DESC)',
  ]);

  const [slug] = await orm2.em.execute<{ condeferred: boolean }[]>(
    `select condeferred from pg_constraint where conname = 'article_slug_unique'`,
  );
  expect(slug.condeferred).toBe(true);
  await expect(orm2.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');
  await orm2.close(true);
});
