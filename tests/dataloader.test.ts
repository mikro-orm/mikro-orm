import { MikroORM, Collection, Utils, Ref, Entity, PrimaryKey, Property, OneToMany, ManyToMany, ManyToOne, Enum, Reference, SqliteDriver, QueryOrder } from '@mikro-orm/sqlite';
import { PublisherType } from './entities';

@Entity()
export class Author {

  @PrimaryKey()
  id!: number;

  @Property()
  name: string;

  @Property()
  email: string;

  @OneToMany(() => Book, book => book.author)
  books = new Collection<Book>(this);

  @ManyToMany(() => Author)
  friends = new Collection<Author>(this);

  constructor({ id, name, email }: { id?: number; name: string; email: string }) {
    if (id) {
      this.id = id;
    }
    this.name = name;
    this.email = email;
  }

}

@Entity()
export class Book {

  @PrimaryKey()
  id!: number;

  @Property()
  title: string;

  @ManyToOne(() => Author)
  author: Ref<Author>;

  @ManyToOne(() => Publisher)
  publisher!: Ref<Publisher> | null;

  constructor({ id, title, author }: { id?: number; title: string; author: Author | Ref<Author> }) {
    if (id) {
      this.id = id;
    }
    this.title = title;
    this.author = Reference.create(author);
  }

}

@Entity()
export class Publisher {

  @PrimaryKey()
  id!: number;

  @Property()
  name: string;

  @OneToMany(() => Book, book => book.publisher)
  books = new Collection<Book, Publisher>(this);

  @Enum(() => PublisherType)
  type = PublisherType.LOCAL;

  constructor({ id, name = 'asd', type = PublisherType.LOCAL }: { id?: number; name?: string; type?: PublisherType }) {
    if (id) {
      this.id = id;
    }
    this.name = name;
    this.type = type;
  }

}

async function populateDatabase(em: MikroORM['em']) {
    const authors = [
      new Author({ id : 1, name: 'a', email: 'a@a.com' }),
      new Author({ id: 2, name: 'b', email: 'b@b.com' }),
      new Author({ id: 3, name: 'c', email: 'c@c.com' }),
      new Author({ id: 4, name: 'd', email:  'd@d.com' }),
      new Author({ id: 5, name: 'e', email: 'e@e.com' }),
    ];
    authors[0].friends.add([authors[1], authors[3], authors[4]]);
    authors[1].friends.add([authors[0]]);
    authors[2].friends.add([authors[3]]);
    authors[3].friends.add([authors[0], authors[2]]);
    authors[4].friends.add([authors[0]]);
    em.persist(authors);

    const publishers = [
      new Publisher({ id: 1, name: 'AAA' }),
      new Publisher({ id: 2, name: 'BBB' }),
    ];
    em.persist(publishers);

    const books = [
      new Book({ id: 1, title: 'One', author: authors[0] }),
      new Book({ id: 2, title: 'Two', author: authors[0] }),
      new Book({ id: 3, title: 'Three', author: authors[1] }),
      new Book({ id: 4, title: 'Four', author: authors[2] }),
      new Book({ id: 5, title: 'Five', author: authors[2] }),
      new Book({ id: 6, title: 'Six', author: authors[2] }),
    ];
    books[0].publisher = Reference.create(publishers[0]);
    books[1].publisher = Reference.create(publishers[1]);
    books[2].publisher = Reference.create(publishers[1]);
    books[3].publisher = Reference.create(publishers[1]);
    books[4].publisher = Reference.create(publishers[1]);
    books[5].publisher = Reference.create(publishers[1]);
    em.persist(books);

    await em.flush();
    em.clear();
}

async function getCollections(em: MikroORM['em']): Promise<Collection<any>[]> {
  const authors = await em.fork().find(Author, {}, { first: 3, orderBy: { id: QueryOrder.ASC } });
  for (const author of authors) {
    expect(author.books.isInitialized()).toBe(false);
    expect(author.friends.isInitialized()).toBe(false);
  }
  const publishers = await em.fork().find(Publisher, {}, { first: 2, orderBy: { id: QueryOrder.ASC } });
  for (const publisher of publishers) {
    expect(publisher.books.isInitialized()).toBe(false);
  }
  return [
    ...authors.map(author => author.books),
    ...publishers.map(publisher => publisher.books),
  ];
}

describe('Dataloader', () => {

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      dbName: ':memory:',
      entities: [Author, Book],
    });

    await orm.schema.createSchema();
  });

  beforeEach(async () => {
    await orm.schema.clearDatabase();
    await populateDatabase(orm.em);
  });

  afterAll(async () => orm.close(true));

  test('groupPrimaryKeysByEntity', () => {
    const map = Utils.groupPrimaryKeysByEntity([
      orm.em.getReference(Author, 1, { wrapped: true }),
      orm.em.getReference(Author, 2, { wrapped: true }),
      orm.em.getReference(Book, 3, { wrapped: true }),
    ] as Ref<any>[]);
    expect(Array.from(map.keys()).length).toBe(2);
    expect(map.has('Author')).toBe(true);
    expect(map.has('Book')).toBe(true);
    const authorIds = Array.from(map.get('Author')!.values());
    const bookIds = Array.from(map.get('Book')!.values());
    expect(authorIds.length).toBe(2);
    expect(bookIds.length).toBe(1);
    expect(authorIds.includes(1)).toBe(true);
    expect(authorIds.includes(2)).toBe(true);
    expect(bookIds.includes(3)).toBe(true);
  });

  test('getRefBatchLoadFn', async () => {
    const refBatchLoadFn = Utils.getRefBatchLoadFn(orm.em);
    const res = await refBatchLoadFn([
      ...[1, 2].map(id => orm.em.getReference(Author, id, { wrapped: true })),
      ...[5, 3, 4].map(id => orm.em.getReference(Book, id, { wrapped: true })),
    ] as Ref<any>[]);
    expect(res.length).toBe(5);
    expect(res[0] instanceof Author).toBe(true);
    expect(res[1] instanceof Author).toBe(true);
    expect(res[2] instanceof Book).toBe(true);
    expect(res[3] instanceof Book).toBe(true);
    expect(res[4] instanceof Book).toBe(true);
    expect(JSON.stringify(Array.from(res).map((el => el.id)))).toBe(JSON.stringify([1, 2, 5, 3, 4]));
  });

  test('groupInversedOrMappedKeysByEntity', async () => {
    const collections = await getCollections(orm.em);
    expect(collections).toBeDefined();

    const map = Utils.groupInversedOrMappedKeysByEntity(collections);
    expect(JSON.stringify(Array.from(map.keys()))).toEqual(JSON.stringify(['Book']));
    const mapObj = Array.from(map.entries()).reduce<Record<string, Record<string, number[]>>>((acc, [className, filterMap]) => {
      acc[className] = Array.from(filterMap.entries()).reduce<Record<string, number[]>>((acc, [prop, set]) => {
        acc[prop] = Array.from(set.values());
        return acc;
      }, {});
      return acc;
    }, {});
    expect(JSON.stringify(mapObj)).toEqual(JSON.stringify({ Book: { author: [ 1, 2, 3 ], publisher: [ 1, 2 ] } }));
  });

  test('groupInversedOrMappedKeysByEntity should throw if the collection has no inverse side', async () => {
    const author = await orm.em.fork().findOneOrFail(Author, 1);
    expect(() => Utils.groupInversedOrMappedKeysByEntity([author.friends])).toThrow();
  });

  test('getColBatchLoadFn', async () => {
    const refBatchLoadFn = Utils.getColBatchLoadFn(orm.em);
    const collections = await getCollections(orm.em);
    const res = await refBatchLoadFn(collections);
    expect(res.length).toBe(collections.length);
    for (let i = 0; i < collections.length; i++) {
      expect(JSON.stringify(res[i].map((el: any) => el.id))).toBe(JSON.stringify((await collections[i].loadItems()).map((el: any) => el.id)));
    }
  });

  afterAll(async () => orm.close(true));

});
