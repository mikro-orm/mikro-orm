import { LazyRef } from '@mikro-orm/core';
import { Entity, ManyToOne, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { MikroORM } from '@mikro-orm/sqlite';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';

@Entity()
class Author {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;
}

@Entity()
class Book {
  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

  // LazyRef<Author> — type-only marker; tsmorph must unwrap to `Author` and must NOT set `ref: true`
  @ManyToOne(() => Author)
  author!: LazyRef<Author>;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Author, Book],
    dbName: ':memory:',
    metadataProvider: TsMorphMetadataProvider,
    metadataCache: { enabled: false },
  });
  await orm.schema.create();
});

afterAll(async () => {
  await orm.close(true);
});

describe('TsMorphMetadataProvider + LazyRef', () => {
  test('tsmorph unwraps LazyRef to the target entity type and does not set ref=true', () => {
    const meta = orm.getMetadata().get(Book);
    const authorProp = meta.properties.author;

    expect(authorProp.type).toBe('Author');
    expect(authorProp.ref).toBeFalsy();
  });

  test('runtime persists and loads via a LazyRef relation (no Reference wrapper)', async () => {
    const author = orm.em.create(Author, { name: 'Ursula' });
    const book = orm.em.create(Book, { title: 'A Wizard of Earthsea', author });
    await orm.em.flush();
    orm.em.clear();

    const found = await orm.em.findOneOrFail(Book, book.id, { populate: ['author'] });
    expect(found.author).toBeInstanceOf(Author);
    expect((found.author as any).unwrap).toBeUndefined();
    expect(found.author.name).toBe('Ursula');
  });
});
