import { MikroORM, Type, helper } from '@mikro-orm/sqlite';
import { Entity, ManyToOne, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { mockLogger } from '../helpers.js';

// JS-form has a `id_` prefix, DB-form does not (mimics ULID <-> UUID style custom types)
class PrefixedIdType extends Type<string, string> {
  override convertToDatabaseValue(value?: string): string {
    if (value == null) {
      return value as unknown as string;
    }

    return value.startsWith('id_') ? value.slice(3) : value;
  }

  override convertToJSValue(value?: string): string {
    if (value == null) {
      return value as unknown as string;
    }

    return value.startsWith('id_') ? value : `id_${value}`;
  }

  override compareAsType(): string {
    return 'string';
  }

  override getColumnType(): string {
    return 'text';
  }
}

@Entity()
class Author {
  @PrimaryKey({ type: PrefixedIdType })
  id!: string;

  @Property()
  name!: string;
}

@Entity()
class Book {
  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

  @ManyToOne(() => Author)
  author!: Author;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [Author, Book],
    dbName: ':memory:',
  });
  await orm.schema.refresh();
});

afterAll(async () => {
  await orm.close(true);
});

test('em.create() with `managed: true` does not desync __originalEntityData for a custom-type PK', async () => {
  const author = orm.em.create(Author, { id: 'id_abc123', name: 'Kafka' }, { managed: true });

  // the snapshot must already be in DB-form, matching what every subsequent flush will compute
  expect(helper(author).__originalEntityData).toEqual({ id: 'abc123', name: 'Kafka' });

  orm.em.persist(author);
  const mock = mockLogger(orm);
  await orm.em.flush();
  await orm.em.flush();
  expect(mock.mock.calls.filter(c => /update/i.test(c[0])).length).toBe(0);
  mock.mockRestore();
});

test('a nested entity object assigned to a to-one relation does not desync __originalEntityData', async () => {
  const book = orm.em.create(Book, {
    title: 'The Trial',
    author: { id: 'id_def456', name: 'Kafka 2' },
  });
  await orm.em.persist(book).flush();

  expect(helper(book.author).__originalEntityData).toEqual({ id: 'def456', name: 'Kafka 2' });

  const mock = mockLogger(orm);
  await orm.em.flush(); // nothing changed, should be a no-op
  expect(mock.mock.calls.filter(c => /update/i.test(c[0])).length).toBe(0);
  mock.mockRestore();
});

test('em.merge() with a raw custom-type PK does not desync __originalEntityData', async () => {
  const author = orm.em.merge(Author, { id: 'id_ghi789', name: 'Orwell' });

  expect(helper(author).__originalEntityData).toEqual({ id: 'ghi789', name: 'Orwell' });

  const mock = mockLogger(orm);
  await orm.em.flush(); // nothing changed, should be a no-op
  expect(mock.mock.calls.filter(c => /update/i.test(c[0])).length).toBe(0);
  mock.mockRestore();
});
