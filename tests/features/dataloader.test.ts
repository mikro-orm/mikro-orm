import {
  MikroORM,
  Collection,
  DataloaderUtils,
  Ref,
  Entity,
  PrimaryKey,
  Property,
  OneToMany,
  ManyToMany,
  ManyToOne,
  Enum,
  ref,
  QueryOrder,
  PrimaryKeyProp,
  helper,
  Primary,
  SimpleLogger,
  Dataloader,
  serialize,
  Filter,
} from '@mikro-orm/sqlite';
import { mockLogger } from '../helpers';

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
  const forkedEm = em.fork();
  const authors = await forkedEm.find(Author, {}, { first: 3, orderBy: { id: QueryOrder.ASC } });
  for (const author of authors) {
    expect(author.books.isInitialized()).toBe(false);
    expect(author.friends.isInitialized()).toBe(false);
  }
  const publishers = await forkedEm.find(Publisher, {}, { first: 2, orderBy: { id: QueryOrder.ASC } });
  for (const publisher of publishers) {
    expect(publisher.books.isInitialized()).toBe(false);
  }
  const chats = await forkedEm.find(Chat, {}, { first: 2 });
  return [
    ...authors.map(author => author.books),
    ...publishers.map(publisher => publisher.books),
    ...authors.map(author => author.buddies),
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
      loggerFactory: options => new SimpleLogger(options),
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
    const resA = await Promise.all(refsA.map(ref => ref.load('age')));
    const resB = await Promise.all(refsB.map(ref => ref.load('age', true)));
    await orm.em.flush();
    expect(resA).toEqual(resB);
  });

  test('Reference.load with populate', async () => {
    const refsA = getReferences(orm.em).slice(0, 2);
    const refsB = getReferences(orm.em).slice(0, 2);
    const resA = await Promise.all(refsA.map(ref => ref.load({ populate: 'books' })));
    const resB = await Promise.all(refsB.map(ref => ref.load({ populate: 'books', dataloader: true })));
    await orm.em.flush();
    expect(serialize(resA)).toEqual(serialize(resB));
  });

  test('Dataloader can be globally enabled for References with true, Dataloader.ALL, Dataloader.REFERENCE', async () => {
    async function getRefs(dataloader: Dataloader | boolean) {
      const orm = await MikroORM.init({
        dbName: ':memory:',
        dataloader,
        entities: [Author, Book, Chat, Message],
        loggerFactory: options => new SimpleLogger(options),
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

    const res = structuredClone(await getRefs(Dataloader.ALL));
    expect(res).toMatchSnapshot();
    expect(await getRefs(true)).toEqual(res);
    expect(await getRefs(Dataloader.REFERENCE)).toEqual(res);
  });

  test('Dataloader should not be globally enabled for References with false, Dataloader.OFF, Dataloader.COLLECTION', async () => {
    async function getRefs(dataloader: Dataloader | boolean) {
      const orm = await MikroORM.init({
        dbName: ':memory:',
        dataloader,
        entities: [Author, Book, Chat, Message],
        loggerFactory: options => new SimpleLogger(options),
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

    const res = structuredClone(await getRefs(Dataloader.OFF));
    expect(res).toMatchSnapshot();
    expect(await getRefs(false)).toEqual(res);
    expect(await getRefs(Dataloader.COLLECTION)).toEqual(res);
  });

  test('Reference dataloader can be disabled per-query', async () => {
    const orm = await MikroORM.init({
      dbName: ':memory:',
      dataloader: Dataloader.ALL,
      entities: [Author, Book, Chat, Message],
      loggerFactory: options => new SimpleLogger(options),
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

  test('groupInversedOrMappedKeysByEntity', async () => {
    const collections = await getCollections(orm.em);
    expect(collections).toBeDefined();

    const map = DataloaderUtils.groupInversedOrMappedKeysByEntity(collections);
    expect(Array.from(map.keys()).map(({ className }) => className)).toEqual(['Book', 'Author', 'Chat', 'Message']);
    const mapObj = Array.from(map.entries()).reduce<Record<string, Record<string, number[]>>>((acc, [{ className }, filterMap]) => {
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

  test('entitiesMapToQueries', async () => {
    const map = new Map([
      [orm.em.getMetadata().get('Book'), new Map([
        ['author', new Set<Primary<any>>([1, 2, 3])],
        ['publisher', new Set<Primary<any>>([1, 2])],
      ])],
      [orm.em.getMetadata().get('Author'), new Map([
        ['buddiesInverse', new Set<Primary<any>>([1, 2, 3])],
      ])],
      [orm.em.getMetadata().get('Chat'), new Map([
        ['owner', new Set<Primary<any>>([1, 2, 3])],
      ])],
      [orm.em.getMetadata().get('Message'), new Map([
        ['chat', new Set<Primary<any>>([{ owner: 1, recipient: 2 }, { owner: 1, recipient: 3 }])],
      ])],
    ]);
    const queries = DataloaderUtils.entitiesMapToQueries(map, orm.em);
    expect(queries).toHaveLength(4);
    for (const query of queries) {
      expect(query instanceof Promise).toBeTruthy();
    }
  });

  test('getColFilter', async () => {
    const promises = DataloaderUtils.entitiesMapToQueries(new Map([
      [orm.em.getMetadata().get('Book'), new Map([
        ['author', new Set<Primary<any>>([1, 2, 3])],
        ['publisher', new Set<Primary<any>>([1, 2])],
      ])],
      [orm.em.getMetadata().get('Author'), new Map([
        ['buddiesInverse', new Set<Primary<any>>([1, 2, 3])],
      ])],
      [orm.em.getMetadata().get('Chat'), new Map([
        ['owner', new Set<Primary<any>>([1, 2, 3])],
      ])],
      [orm.em.getMetadata().get('Message'), new Map([
        ['chat', new Set<Primary<any>>([{ owner: 1, recipient: 2 }, { owner: 1, recipient: 3 }])],
      ])],
    ]), orm.em);
    const results = (await Promise.all(promises)).flat();

    const collections = await getCollections(orm.em);
    for (const collection of collections) {
      const filtered = results.filter(DataloaderUtils.getColFilter(collection));
      expect(filtered.map((el: any) => el.id)).toEqual((await collection.loadItems()).map((el: any) => el.id));
    }
    expect(true).toBeTruthy();
  });

  test('getColBatchLoadFn', async () => {
    const refBatchLoadFn = DataloaderUtils.getColBatchLoadFn(orm.em);
    const collections = await getCollections(orm.em);
    const mock = mockLogger(orm);
    const res = await refBatchLoadFn(collections);
    await orm.em.flush();
    expect(mock.mock.calls).toMatchSnapshot();
    expect(res.length).toBe(collections.length);
    for (let i = 0; i < collections.length; i++) {
      expect(res[i].map((el: any) => el.id)).toEqual((await collections[i].loadItems()).map((el: any) => el.id));
    }
  });

  test('Collection.load', async () => {
    const colsA = await getCollections(orm.em);
    const colsB = await getCollections(orm.em);
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

  test('Dataloader can be globally enabled for Collections with true, Dataloader.ALL, Dataloader.COLLECTION', async () => {
    async function getCols(dataloader: Dataloader | boolean) {
      const orm = await MikroORM.init({
        dbName: ':memory:',
        dataloader,
        entities: [Author, Book, Chat, Message],
        loggerFactory: options => new SimpleLogger(options),
      });
      await orm.schema.createSchema();
      await populateDatabase(orm.em);
      const cols = await getCollections(orm.em);
      const mock = mockLogger(orm);
      await Promise.all(cols.map(col => col.load()));
      await orm.em.flush();
      await orm.close(true);
      return mock.mock.calls;
    }

    const res = structuredClone(await getCols(Dataloader.ALL));
    expect(res).toMatchSnapshot();
    expect(await getCols(true)).toEqual(res);
    expect(await getCols(Dataloader.COLLECTION)).toEqual(res);
  });

  test('Dataloader should not be globally enabled for Collections with false, Dataloader.OFF, Dataloader.REFERENCE', async () => {
    async function getCols(dataloader: Dataloader | boolean) {
      const orm = await MikroORM.init({
        dbName: ':memory:',
        dataloader,
        entities: [Author, Book, Chat, Message],
        loggerFactory: options => new SimpleLogger(options),
      });
      await orm.schema.createSchema();
      await populateDatabase(orm.em);
      const cols = await getCollections(orm.em);
      const mock = mockLogger(orm);
      await Promise.all(cols.map(col => col.load()));
      await orm.em.flush();
      await orm.close(true);
      return mock.mock.calls;
    }

    const res = structuredClone(await getCols(Dataloader.OFF));
    expect(res).toMatchSnapshot();
    expect(await getCols(false)).toEqual(res);
    expect(await getCols(Dataloader.REFERENCE)).toEqual(res);
  });

  test('Collection dataloader can be disabled per-query', async () => {
    const orm = await MikroORM.init({
      dbName: ':memory:',
      dataloader: Dataloader.ALL,
      entities: [Author, Book, Chat, Message],
      loggerFactory: options => new SimpleLogger(options),
    });
    await orm.schema.createSchema();
    await populateDatabase(orm.em);

    const cols = await getCollections(orm.em);
    const mock = mockLogger(orm);
    await Promise.all(cols.map(col => col.load({ dataloader: false })));
    await orm.em.flush();
    expect(mock.mock.calls).toMatchSnapshot();

    await orm.close(true);
  });

  test('getDataloaderType', async () => {
    expect(DataloaderUtils.getDataloaderType(true)).toEqual(Dataloader.ALL);
    expect(DataloaderUtils.getDataloaderType(false)).toEqual(Dataloader.OFF);
    expect(DataloaderUtils.getDataloaderType(Dataloader.COLLECTION)).toEqual(Dataloader.COLLECTION);
  });
});
