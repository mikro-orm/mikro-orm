import { Collection, MikroORM } from '@mikro-orm/postgresql';
import {
  Entity,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryKey,
  Property,
  ReflectMetadataProvider,
} from '@mikro-orm/decorators/legacy';
import { mockLogger } from '../../helpers.js';

@Entity({ schema: 'a' })
class Author {
  @PrimaryKey()
  id!: number;

  @ManyToMany({ entity: () => Book, owner: true })
  books = new Collection<Book>(this);
}

@Entity({ schema: 'b' })
class Book {
  @PrimaryKey()
  id!: number;

  @OneToMany(() => Review, r => r.book)
  reviews = new Collection<Review>(this);
}

@Entity({ schema: 'b' })
class Review {
  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Book)
  book!: Book;

  @Property()
  rating!: number;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: 'mikro_orm_test_7894',
    entities: [Author, Book, Review],
    metadataProvider: ReflectMetadataProvider,
  });
  await orm.schema.refresh();
});

afterAll(async () => {
  await orm.close(true);
});

test('nested $some across schemas uses target entity schema (GH #7894)', async () => {
  const mock = mockLogger(orm);

  await orm.em.findOne(Author, {
    books: { $some: { reviews: { $some: { rating: 5 } } } },
  });

  const sql = mock.mock.calls.map(c => c[0]).join('\n');
  expect(sql).toContain('"b"."book"');
  expect(sql).not.toContain('"a"."book"');
});
