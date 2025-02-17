import {
  Collection,
  DataloaderType,
  DataloaderUtils,
  Entity,
  Enum,
  Filter,
  helper,
  ManyToMany,
  ManyToOne,
  MikroORM,
  OneToMany,
  Primary,
  PrimaryKey,
  PrimaryKeyProp,
  Property,
  QueryOrder,
  Ref,
  ref,
  serialize,
  SimpleLogger,
} from '@mikro-orm/sqlite';
import { mockLogger } from '../../helpers.js';

enum PublisherType {
  LOCAL = 'local',
  GLOBAL = 'global',
}

@Filter({ name: 'young', cond: { age: { $lt: 80 } }, default: true })
@Entity()
class Author {

  @PrimaryKey()
  id!: number;

  @Property()
  name: string;

  @Property()
  age: number;

  @Property()
  email: string;

  @OneToMany(() => Book, book => book.author)
  books = new Collection<Book>(this);

  // No inverse side exists
  @ManyToMany(() => Author)
  friends = new Collection<Author>(this);

  // Inverse side exists
  @ManyToMany(() => Author)
  buddies = new Collection<Author>(this);

  @ManyToMany(() => Author, author => author.buddies)
  buddiesInverse = new Collection<Author>(this);

  @OneToMany(() => Chat, chat => chat.owner)
  ownedChats: Collection<Chat> = new Collection<Chat>(this);

  constructor({ id, name, age, email }: { id?: number; name: string; age: number; email: string }) {
    if (id) {
      this.id = id;
    }
    this.name = name;
    this.age = age;
    this.email = email;
  }

}

@Entity()
class Book {

  @PrimaryKey()
  id!: number;

  @Property()
  title: string;

  @ManyToOne(() => Author, { ref: true })
  author: Ref<Author>;

  @ManyToOne(() => Publisher, { ref: true, nullable: true })
  publisher!: Ref<Publisher> | null;

  constructor({ id, title, author }: { id?: number; title: string; author: Author | Ref<Author> }) {
    if (id) {
      this.id = id;
    }
    this.title = title;
    this.author = ref(author);
  }

}

@Entity()
class Publisher {

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

@Entity()
class Chat {

  @ManyToOne(() => Author, { ref: true, primary: true })
  owner: Ref<Author>;

  @ManyToOne(() => Author, { ref: true, primary: true })
  recipient: Ref<Author>;

  [PrimaryKeyProp]?: ['owner', 'recipient'];

  @OneToMany(() => Message, message => message.chat)
  messages: Collection<Message> = new Collection<Message>(this);

  constructor({ owner, recipient }: { owner: Author | Ref<Author>; recipient: Author | Ref<Author> }) {
    this.owner = ref(owner);
    this.recipient = ref(recipient);
  }

}

@Entity()
class Message {

  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Chat, { ref: true })
  chat!: Ref<Chat>;

  @Property()
  content: string;

  constructor({ id, chat, content }: { id?: number; chat?: Chat | Ref<Chat>; content: string }) {
    if (id) {
      this.id = id;
    }
    if (chat) {
      this.chat = ref(chat);
    }
    this.content = content;
  }

}

async function populateDatabase(em: MikroORM['em']) {
  const authors = [
    new Author({ id : 1, name: 'a', age: 31, email: 'a@a.com' }),
    new Author({ id: 2, name: 'b', age: 47, email: 'b@b.com' }),
    new Author({ id: 3, name: 'c', age: 26, email: 'c@c.com' }),
    new Author({ id: 4, name: 'd', age: 87, email:  'd@d.com' }),
    new Author({ id: 5, name: 'e', age: 39, email: 'e@e.com' }),
  ];
  authors[0].friends.add([authors[1], authors[3], authors[4]]);
  authors[1].friends.add([authors[0]]);
  authors[2].friends.add([authors[3]]);
  authors[3].friends.add([authors[0], authors[2]]);
  authors[4].friends.add([authors[0]]);
  authors[0].buddies.add([authors[1], authors[3], authors[4]]);
  authors[1].buddies.add([authors[0]]);
  authors[2].buddies.add([authors[3]]);
  authors[3].buddies.add([authors[0], authors[2]]);
  authors[4].buddies.add([authors[0]]);
  em.persist(authors);

  const chats = [
    new Chat({ owner: authors[0], recipient: authors[1] }),
    new Chat({ owner: authors[0], recipient: authors[2] }),
    new Chat({ owner: authors[0], recipient: authors[4] }),
    new Chat({ owner: authors[2], recipient: authors[0] }),
  ];
  chats[0].messages.add([new Message({ content: 'A1' }), new Message({ content: 'A2' })]);
  chats[1].messages.add([new Message({ content: 'B1' }), new Message({ content: 'B2' })]);
  chats[3].messages.add([new Message({ content: 'C1' })]);
  em.persist(chats);

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
  books[0].publisher = ref(publishers[0]);
  books[1].publisher = ref(publishers[1]);
  books[2].publisher = ref(publishers[1]);
  books[3].publisher = ref(publishers[1]);
  books[4].publisher = ref(publishers[1]);
  books[5].publisher = ref(publishers[1]);
  em.persist(books);

  await em.flush();
  em.clear();
}

function getReferences(em: MikroORM['em']): Ref<any>[] {
  const forkedEm = em.fork();
  return [
    ...[1, 2].map(id => forkedEm.getReference(Author, id, { wrapped: true })),
    ...[5, 3, 4].map(id => forkedEm.getReference(Book, id, { wrapped: true })),
    ...([[1, 2], [1, 3], [3, 1]] as const).map(pk => forkedEm.getReference(Chat, pk, { wrapped: true })),
  ] as Ref<any>[];
}

async function getCollections(em: MikroORM['em']): Promise<Collection<any>[]> {
  const authors = await em.find(Author, {}, { first: 3, orderBy: { id: QueryOrder.ASC } });
  for (const author of authors) {
    expect(author.books.isInitialized()).toBe(false);
    expect(author.friends.isInitialized()).toBe(false);
  }
  const publishers = await em.find(Publisher, {}, { first: 2, orderBy: { id: QueryOrder.ASC } });
  for (const publisher of publishers) {
    expect(publisher.books.isInitialized()).toBe(false);
  }
  const chats = await em.find(Chat, {}, { first: 2 });
  return [
    ...authors.map(author => author.books),
    ...publishers.map(publisher => publisher.books),
    ...authors.map(author => author.buddies),
    // ...authors.map(author => author.friends),
    ...authors.map(author => author.ownedChats),
    ...chats.map(chat => chat.messages),
  ];
}

describe('Dataloader', () => {

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      dbName: ':memory:',
      entities: [Author, Book, Chat, Message],
      loggerFactory: SimpleLogger.create,
    });

    await orm.schema.createSchema();
  });

  beforeEach(async () => {
    await orm.schema.clearDatabase();
    await populateDatabase(orm.em);
  });

  afterAll(async () => orm.close(true));

  test('groupPrimaryKeysByEntityAndOpts', () => {
    const map = DataloaderUtils.groupPrimaryKeysByEntityAndOpts([
      [orm.em.getReference(Author, 1, { wrapped: true })],
      [orm.em.getReference(Author, 2, { wrapped: true })],
      [orm.em.getReference(Book, 3, { wrapped: true })],
    ] as [Ref<any>][]);
    expect(Array.from(map.keys()).length).toBe(2);
    expect(map.has('Author|{}')).toBe(true);
    expect(map.has('Book|{}')).toBe(true);
    const authorIds = Array.from(map.get('Author|{}')!.values());
    const bookIds = Array.from(map.get('Book|{}')!.values());
    expect(authorIds.length).toBe(2);
    expect(bookIds.length).toBe(1);
    expect(authorIds.includes(1)).toBe(true);
    expect(authorIds.includes(2)).toBe(true);
    expect(bookIds.includes(3)).toBe(true);
  });

  test('getRefBatchLoadFn', async () => {
    const refBatchLoadFn = DataloaderUtils.getRefBatchLoadFn(orm.em);
    const mock = mockLogger(orm);
    const res = await refBatchLoadFn(getReferences(orm.em).map(ref => [ref]));
    await orm.em.flush();
    expect(mock.mock.calls).toMatchSnapshot();
    expect(res.length).toBe(8);
    expect(res[0] instanceof Author).toBe(true);
    expect(res[1] instanceof Author).toBe(true);
    expect(res[2] instanceof Book).toBe(true);
    expect(res[3] instanceof Book).toBe(true);
    expect(res[4] instanceof Book).toBe(true);
    expect(res[5] instanceof Chat).toBe(true);
    expect(res[6] instanceof Chat).toBe(true);
    expect(res[7] instanceof Chat).toBe(true);
    expect(Array.from(res).slice(0, 5).map((el => el.id))).toEqual([1, 2, 5, 3, 4]);
    expect(Array.from(res).slice(5).map((({ owner: { id: ownerId }, recipient: { id: recipientId } }) => [ownerId, recipientId]))).toEqual([[1, 2], [1, 3], [3, 1]]);
  });

  test('Reference.load', async () => {
    const refsA = getReferences(orm.em);
    const refsB = getReferences(orm.em);
    await Promise.all(refsA.map(ref => ref.load()));
    const mock = mockLogger(orm);
    await Promise.all(refsB.map(ref => ref.load({ dataloader: true })));
    await orm.em.flush();
    expect(mock.mock.calls).toMatchSnapshot();
    expect(serialize(refsA)).toEqual(serialize(refsB));
  });

  test('Reference.load with prop', async () => {
    const refsA = getReferences(orm.em).slice(0, 2);
    const refsB = getReferences(orm.em).slice(0, 2);
    const resA = await Promise.all(refsA.map(ref => ref.loadProperty('age')));
    const resB = await Promise.all(refsB.map(ref => ref.loadProperty('age', { dataloader: true })));
    await orm.em.flush();
    expect(resA).toEqual(resB);
  });

  test('Reference.load with populate', async () => {
    const refsA = getReferences(orm.em).slice(0, 2);
    const refsB = getReferences(orm.em).slice(0, 2);
    const resA = await Promise.all(refsA.map(ref => ref.load({ populate: ['books'] })));
    const resB = await Promise.all(refsB.map(ref => ref.load({ populate: ['books'], dataloader: true })));
    await orm.em.flush();
    expect(serialize(resA)).toEqual(serialize(resB));
  });

  test('Dataloader can be globally enabled for References with true, DataloaderType.ALL, DataloaderType.REFERENCE', async () => {
    async function getRefs(dataloader: DataloaderType | boolean) {
      const orm = await MikroORM.init({
        dbName: ':memory:',
        dataloader,
        entities: [Author, Book, Chat, Message],
        loggerFactory: SimpleLogger.create,
      });
      await orm.schema.createSchema();
      await populateDatabase(orm.em);
      const refs = getReferences(orm.em);
      const mock = mockLogger(orm);
      await Promise.all(refs.map(ref => ref.load()));
      await orm.em.flush();
      await orm.close(true);
      return mock.mock.calls;
    }

    const res = structuredClone(await getRefs(DataloaderType.ALL));
    expect(res).toMatchSnapshot();
    expect(await getRefs(true)).toEqual(res);
    expect(await getRefs(DataloaderType.REFERENCE)).toEqual(res);
  });

  test('Dataloader should not be globally enabled for References with false, DataloaderType.NONE, DataloaderType.COLLECTION', async () => {
    async function getRefs(dataloader: DataloaderType | boolean) {
      const orm = await MikroORM.init({
        dbName: ':memory:',
        dataloader,
        entities: [Author, Book, Chat, Message],
        loggerFactory: SimpleLogger.create,
      });
      await orm.schema.createSchema();
      await populateDatabase(orm.em);
      const refs = getReferences(orm.em);
      const mock = mockLogger(orm);
      await Promise.all(refs.map(ref => ref.load()));
      await orm.em.flush();
      await orm.close(true);
      return mock.mock.calls;
    }

    const res = structuredClone(await getRefs(DataloaderType.NONE));
    expect(res).toMatchSnapshot();
    expect(await getRefs(false)).toEqual(res);
    expect(await getRefs(DataloaderType.COLLECTION)).toEqual(res);
  });

  test('Reference dataloader can be disabled per-query', async () => {
    const orm = await MikroORM.init({
      dbName: ':memory:',
      dataloader: DataloaderType.ALL,
      entities: [Author, Book, Chat, Message],
      loggerFactory: SimpleLogger.create,
    });
    await orm.schema.createSchema();
    await populateDatabase(orm.em);

    const refs = getReferences(orm.em);
    const mock = mockLogger(orm);
    await Promise.all(refs.map(ref => ref.load({ dataloader: false })));
    await orm.em.flush();
    expect(mock.mock.calls).toMatchSnapshot();

    await orm.close(true);
  });

  test('groupInversedOrMappedKeysByEntityAndOpts', async () => {
    const collections = await getCollections(orm.em.fork());
    expect(collections).toBeDefined();

    const map = DataloaderUtils.groupInversedOrMappedKeysByEntityAndOpts(collections.map(col => [col]));
    expect(Array.from(map.keys()).map(key => key.substring(0, key.indexOf('|')))).toEqual(['Book', 'Author', 'Chat', 'Message']);
    const mapObj = Array.from(map.entries()).reduce<Record<string, Record<string, number[]>>>((acc, [key, filterMap]) => {
      const className = key.substring(0, key.indexOf('|'));
      acc[className] = Array.from(filterMap.entries()).reduce<Record<string, number[]>>((acc, [prop, set]) => {
        acc[prop] = Array.from(set.values());
        return acc;
      }, {});
      return acc;
    }, {});
    expect(mapObj).toEqual({
      Book: { author: [1, 2, 3], publisher: [1, 2] },
      Author: { buddiesInverse: [1, 2, 3] },
      Chat: { owner: [1, 2, 3] },
      Message: { chat: [{ owner: 1, recipient: 2 }, { owner: 1, recipient: 3 }] },
    });
  });

  test('entitiesAndOptsMapToQueries', async () => {
    const map = new Map([
      ['Book|{}', new Map([
        ['author', new Set<Primary<any>>([1, 2, 3])],
        ['publisher', new Set<Primary<any>>([1, 2])],
      ])],
      ['Author|{}', new Map([
        ['buddiesInverse', new Set<Primary<any>>([1, 2, 3])],
      ])],
      ['Chat|{}', new Map([
        ['owner', new Set<Primary<any>>([1, 2, 3])],
      ])],
      ['Message|{}', new Map([
        ['chat', new Set<Primary<any>>([{ owner: 1, recipient: 2 }, { owner: 1, recipient: 3 }])],
      ])],
    ]);
    const queries = DataloaderUtils.entitiesAndOptsMapToQueries(map, orm.em);
    expect(queries).toHaveLength(4);
    for (const query of queries) {
      expect(query instanceof Promise).toBeTruthy();
    }
  });

  test('getColFilter', async () => {
    const promises = DataloaderUtils.entitiesAndOptsMapToQueries(new Map([
      ['Book|{}', new Map([
        ['author', new Set<Primary<any>>([1, 2, 3])],
        ['publisher', new Set<Primary<any>>([1, 2])],
      ])],
      ['Author|{}', new Map([
        ['buddiesInverse', new Set<Primary<any>>([1, 2, 3])],
      ])],
      ['Chat|{}', new Map([
        ['owner', new Set<Primary<any>>([1, 2, 3])],
      ])],
      ['Message|{}', new Map([
        ['chat', new Set<Primary<any>>([{ owner: 1, recipient: 2 }, { owner: 1, recipient: 3 }])],
      ])],
    ]), orm.em);
    const resultsMap = new Map(await Promise.all(promises));
    const collections = await getCollections(orm.em);

    for (const collection of collections) {
      const key = `${collection.property.targetMeta!.className}|{}`;
      const entities = resultsMap.get(key)!;
      const filtered = entities.filter(DataloaderUtils.getColFilter(collection));
      expect(filtered.map((el: any) => el.id)).toEqual((await collection.loadItems()).map((el: any) => el.id));
    }
  });

  test('getColBatchLoadFn', async () => {
    const refBatchLoadFn = DataloaderUtils.getColBatchLoadFn(orm.em);
    const collections = await getCollections(orm.em);
    const mock = mockLogger(orm);
    const res = await refBatchLoadFn(collections.map(col => [col]));
    await orm.em.flush();
    expect(mock.mock.calls).toMatchSnapshot();
    expect(res.length).toBe(collections.length);
    for (let i = 0; i < collections.length; i++) {
      expect(res[i].map((el: any) => el.id)).toEqual((await collections[i].loadItems()).map((el: any) => el.id));
    }
  });

  test('Collection.load', async () => {
    const colsA = await getCollections(orm.em.fork());
    const colsB = await getCollections(orm.em.fork());
    await Promise.all(colsA.map(col => col.loadItems()));
    const mock = mockLogger(orm);
    await Promise.all(colsB.map(col => col.load({ dataloader: true })));
    await orm.em.flush();
    expect(mock.mock.calls).toMatchSnapshot();
    expect(colsA.length).toBe(colsB.length);
    for (const [colA, colB] of colsA.map((colA, i) => [colA, colsB[i]])) {
      expect(colA.isInitialized()).toBe(true);
      expect(colB.isInitialized()).toBe(true);
      expect(colA.getItems().map(el => helper(el).getPrimaryKey())).toEqual(colB.getItems().map(el => helper(el).getPrimaryKey()));
    }
  });

  test('Collection.load with orderBy', async () => {
    const colsA = (await orm.em.fork().find(Author, { id: [1, 2, 3] })).map(({ books }) => books);
    const colsB = (await orm.em.fork().find(Author, { id: [1, 2, 3] })).map(({ books }) => books);
    await Promise.all(colsA.map(col => col.loadItems({ orderBy: { title: QueryOrder.ASC } })));
    const mock = mockLogger(orm);
    await Promise.all(colsB.map(col => col.load({ orderBy: { title: QueryOrder.ASC }, dataloader: true })));
    await orm.em.flush();
    expect(mock.mock.calls).toMatchSnapshot();
    expect(colsA.length).toBe(colsB.length);
    for (const [colA, colB] of colsA.map((colA, i) => [colA, colsB[i]])) {
      expect(colA.isInitialized()).toBe(true);
      expect(colB.isInitialized()).toBe(true);
      expect(colA.getItems().map(el => helper(el).getPrimaryKey())).toEqual(colB.getItems().map(el => helper(el).getPrimaryKey()));
    }
  });

  test('Collection.load with where (One to Many)', async () => {
    const getCols = async () => {
      const em = orm.em.fork();
      return [
        // (await em.findOneOrFail(Author, { id: 1 })).books,
        // (await em.findOneOrFail(Author, { id: 1 })).books,
        // (await em.findOneOrFail(Author, { id: 1 })).books,
        ...(await em.find(Author, { id: [1, 2, 3] })).map(({ books }) => books),
      ];
    };
    const colsA = await getCols();
    const colsB = await getCols();
    /*
    new Book({ id: 1, title: 'One', author: authors[0] }),
    new Book({ id: 2, title: 'Two', author: authors[0] }),
    new Book({ id: 3, title: 'Three', author: authors[1] }),
    new Book({ id: 4, title: 'Four', author: authors[2] }),
    new Book({ id: 5, title: 'Five', author: authors[2] }),
    new Book({ id: 6, title: 'Six', author: authors[2] }),
    */
    const optsMap = [
      {},
      { where: { title: [ 'One', 'Two', 'Six' ] } },
      // { where: { title: [ 'One', 'Six' ] } },
      // { where: { title: [ 'Six' ] } },
      // { where: { title: [ 'One', 'Two', 'Six' ] } },
      { where: { title: [ 'One', 'Two', 'Six' ] } },
    ];
    const resultsA = await Promise.all(colsA.map((col, i) => col.loadItems(optsMap[i])));
    const mock = mockLogger(orm);
    const resultsB = await Promise.all(colsB.map((col, i) => col.loadItems({ ...optsMap[i], dataloader: true })));
    await orm.em.flush();
    expect(mock.mock.calls).toMatchSnapshot();
    expect(resultsA.length).toBe(resultsB.length);
    for (const [colA, colB] of colsA.map((colA, i) => [colA, colsB[i]])) {
      expect(colA.isInitialized()).toBe(true);
      expect(colB.isInitialized()).toBe(true);
      expect(colA.getItems().map(el => helper(el).getPrimaryKey())).toEqual(colB.getItems().map(el => helper(el).getPrimaryKey()));
    }
    for (const [resA, resB] of resultsA.map((resA, i) => [resA, resultsB[i]])) {
      expect(resA.map(el => helper(el).getPrimaryKey())).toEqual(resB.map(el => helper(el).getPrimaryKey()));
    }
  });

  test('Collection.load with where (Many to Many + Inverse side)', async () => {
    const getCols = async () => {
      const em = orm.em.fork();
      return [
        ...(await em.find(Author, { id: [1, 2, 3] })).map(({ buddies }) => buddies),
      ];
    };
    const colsA = await getCols();
    const colsB = await getCols();
    /*
    authors[0].buddies.add([authors[1], authors[3], authors[4]]); -> 'b', 'd', 'e' -> 'b', 'e' ('d' is old)
    authors[1].buddies.add([authors[0]]);                         -> 'a'
    authors[2].buddies.add([authors[3]]);                         -> 'd' -> void ('d' is old)
    authors[3].buddies.add([authors[0], authors[2]]);   (d) OLD   -> 'a', 'c'
    authors[4].buddies.add([authors[0]]);                         -> 'a'
    */
    const resultsA = await Promise.all(colsA.map((col, i) => col.loadItems()));
    const mock = mockLogger(orm);
    const resultsB = await Promise.all(colsB.map((col, i) => col.loadItems({ dataloader: true })));
    await orm.em.flush();
    expect(mock.mock.calls).toMatchSnapshot();
    expect(colsA.length).toBe(colsB.length);
    for (const [colA, colB] of colsA.map((colA, i) => [colA, colsB[i]])) {
      expect(colA.isInitialized()).toBe(true);
      expect(colB.isInitialized()).toBe(true);
      expect(colA.getItems().map(el => helper(el).getPrimaryKey())).toEqual(colB.getItems().map(el => helper(el).getPrimaryKey()));
    }
    for (const [resA, resB] of resultsA.map((resA, i) => [resA, resultsB[i]])) {
      expect(resA.map(el => helper(el).getPrimaryKey())).toEqual(resB.map(el => helper(el).getPrimaryKey()));
    }
  });

  test('Collection.load with where (Many to Many + Inverse side + custom where filters)', async () => {
    const getCols = async () => {
      const em = orm.em.fork();
      return [
        ...(await em.find(Author, { id: [1, 2, 3] })).map(({ buddies }) => buddies),
      ];
    };
    const colsA = await getCols();
    const colsB = await getCols();
    /*
    authors[0].buddies.add([authors[1], authors[3], authors[4]]); -> 'b', 'd', 'e' -> 'b', 'e' ('d' is old)
    authors[1].buddies.add([authors[0]]);                         -> 'a'
    authors[2].buddies.add([authors[3]]);                         -> 'd' -> void ('d' is old)
    authors[3].buddies.add([authors[0], authors[2]]);   (d) OLD   -> 'a', 'c'
    authors[4].buddies.add([authors[0]]);                         -> 'a'
    */
    const resultsA = await Promise.all(colsA.map((col, i) => col.loadItems({ where: { name: [ 'b', 'd' ] } })));
    const mock = mockLogger(orm);
    const resultsB = await Promise.all(colsB.map((col, i) => col.loadItems({ where: { name: [ 'b', 'd' ] }, dataloader: true })));
    await orm.em.flush();
    expect(mock.mock.calls).toMatchSnapshot();
    expect(colsA.length).toBe(colsB.length);
    for (const [colA, colB] of colsA.map((colA, i) => [colA, colsB[i]])) {
      expect(colA.isInitialized()).toBe(true);
      expect(colB.isInitialized()).toBe(true);
      expect(colA.getItems().map(el => helper(el).getPrimaryKey())).toEqual(colB.getItems().map(el => helper(el).getPrimaryKey()));
    }
    for (const [resA, resB] of resultsA.map((resA, i) => [resA, resultsB[i]])) {
      expect(resA.map(el => helper(el).getPrimaryKey())).toEqual(resB.map(el => helper(el).getPrimaryKey()));
    }
  });

  test('Collection.load with where (Many to Many + Inverse side + different custom where filters for each collection)', async () => {
    const getCols = async () => {
      const em = orm.em.fork();
      return [
        ...(await em.find(Author, { id: [1, 2, 3] })).map(({ buddies }) => buddies),
      ];
    };
    const colsA = await getCols();
    const colsB = await getCols();
    const optsMap = [
      { where: { name: [ 'b', 'd' ] } },
      { where: { name: [ 'a', 'b', 'c', 'd', 'e' ] } },
      { where: { name: [ 'a', 'b', 'c', 'd', 'e' ] } },
    ];
    /*
    authors[0].buddies.add([authors[1], authors[3], authors[4]]); -> 'b', 'd', 'e' -> 'b', 'e' ('d' is old)
    authors[1].buddies.add([authors[0]]);                         -> 'a'
    authors[2].buddies.add([authors[3]]);                         -> 'd' -> void ('d' is old)
    authors[3].buddies.add([authors[0], authors[2]]);   (d) OLD   -> 'a', 'c'
    authors[4].buddies.add([authors[0]]);                         -> 'a'
    */
    const resultsA = await Promise.all(colsA.map((col, i) => col.loadItems(optsMap[i])));
    const mock = mockLogger(orm);
    const resultsB = await Promise.all(colsB.map((col, i) => col.loadItems({ ...optsMap[i], dataloader: true })));
    await orm.em.flush();
    expect(mock.mock.calls).toMatchSnapshot();
    expect(colsA.length).toBe(colsB.length);
    for (const [colA, colB] of colsA.map((colA, i) => [colA, colsB[i]])) {
      expect(colA.isInitialized()).toBe(true);
      expect(colB.isInitialized()).toBe(true);
      expect(colA.getItems().map(el => helper(el).getPrimaryKey())).toEqual(colB.getItems().map(el => helper(el).getPrimaryKey()));
    }
    for (const [resA, resB] of resultsA.map((resA, i) => [resA, resultsB[i]])) {
      expect(resA.map(el => helper(el).getPrimaryKey())).toEqual(resB.map(el => helper(el).getPrimaryKey()));
    }
  });

  test('Collection.load with populate', async () => {
    const colsA = (await orm.em.fork().find(Author, { id: [1, 2, 3] })).map(({ books }) => books);
    const colsB = (await orm.em.fork().find(Author, { id: [1, 2, 3] })).map(({ books }) => books);
    await Promise.all(colsA.map(col => col.loadItems({ populate: [ 'publisher' ] })));
    const mock = mockLogger(orm);
    await Promise.all(colsB.map(col => col.load({ populate: [ 'publisher' ], dataloader: true })));
    await orm.em.flush();
    expect(mock.mock.calls).toMatchSnapshot();
    expect(colsA.length).toBe(colsB.length);
    for (const [colA, colB] of colsA.map((colA, i) => [colA, colsB[i]])) {
      expect(colA.isInitialized()).toBe(true);
      expect(colB.isInitialized()).toBe(true);
      for (const book of colB.getItems()) {
        expect(book.publisher!.isInitialized()).toBeTruthy();
      }
      expect(colB.isInitialized()).toBe(true);
      expect(colA.getItems().map(el => helper(el).getPrimaryKey())).toEqual(colB.getItems().map(el => helper(el).getPrimaryKey()));
    }
  });

  test('Collection.load with wildcard populate', async () => {
    const colsA = (await orm.em.fork().find(Author, { id: [1, 2, 3] })).map(({ books }) => books);
    const colsB = (await orm.em.fork().find(Author, { id: [1, 2, 3] })).map(({ books }) => books);
    await Promise.all(colsA.map(col => col.loadItems({ populate: [ '*' ] })));
    const mock = mockLogger(orm);
    await Promise.all(colsB.map(col => col.load({ populate: [ '*' ], dataloader: true })));
    await orm.em.flush();
    expect(mock.mock.calls).toMatchSnapshot();
    expect(colsA.length).toBe(colsB.length);
    for (const [colA, colB] of colsA.map((colA, i) => [colA, colsB[i]])) {
      expect(colA.isInitialized()).toBe(true);
      expect(colB.isInitialized()).toBe(true);
      for (const book of colB.getItems()) {
        expect(book.publisher!.isInitialized()).toBeTruthy();
      }
      expect(colB.isInitialized()).toBe(true);
      expect(colA.getItems().map(el => helper(el).getPrimaryKey())).toEqual(colB.getItems().map(el => helper(el).getPrimaryKey()));
    }
  });

  test('Dataloader can be globally enabled for Collections with true, DataloaderType.ALL, DataloaderType.COLLECTION', async () => {
    async function getCols(dataloader: DataloaderType | boolean) {
      const orm = await MikroORM.init({
        dbName: ':memory:',
        dataloader,
        entities: [Author, Book, Chat, Message],
        loggerFactory: SimpleLogger.create,
      });
      await orm.schema.createSchema();
      await populateDatabase(orm.em);
      const cols = await getCollections(orm.em.fork());
      const mock = mockLogger(orm);
      await Promise.all(cols.map(col => col.load()));
      await orm.em.flush();
      await orm.close(true);
      return mock.mock.calls;
    }

    const res = structuredClone(await getCols(DataloaderType.ALL));
    expect(res).toMatchSnapshot();
    expect(await getCols(true)).toEqual(res);
    expect(await getCols(DataloaderType.COLLECTION)).toEqual(res);
  });

  test('Dataloader should not be globally enabled for Collections with false, DataloaderType.NONE, DataloaderType.REFERENCE', async () => {
    async function getCols(dataloader: DataloaderType | boolean) {
      const orm = await MikroORM.init({
        dbName: ':memory:',
        dataloader,
        entities: [Author, Book, Chat, Message],
        loggerFactory: SimpleLogger.create,
      });
      await orm.schema.createSchema();
      await populateDatabase(orm.em);
      const cols = await getCollections(orm.em.fork());
      const mock = mockLogger(orm);
      await Promise.all(cols.map(col => col.load()));
      await orm.em.flush();
      await orm.close(true);
      return mock.mock.calls;
    }

    const res = structuredClone(await getCols(DataloaderType.NONE));
    expect(res).toMatchSnapshot();
    expect(await getCols(false)).toEqual(res);
    expect(await getCols(DataloaderType.REFERENCE)).toEqual(res);
  });

  test('Collection dataloader can be disabled per-query', async () => {
    const orm = await MikroORM.init({
      dbName: ':memory:',
      dataloader: DataloaderType.ALL,
      entities: [Author, Book, Chat, Message],
      loggerFactory: SimpleLogger.create,
    });
    await orm.schema.createSchema();
    await populateDatabase(orm.em);

    const cols = await getCollections(orm.em.fork());
    const mock = mockLogger(orm);
    await Promise.all(cols.map(col => col.load({ dataloader: false })));
    await orm.em.flush();
    expect(mock.mock.calls).toMatchSnapshot();

    await orm.close(true);
  });
});
