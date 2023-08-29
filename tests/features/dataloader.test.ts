import { MikroORM, Collection, Utils, Ref, Entity, PrimaryKey, Property, OneToMany, ManyToMany, ManyToOne, Enum, ref, QueryOrder, PrimaryKeyProp, helper, Primary, SimpleLogger } from '@mikro-orm/sqlite';
import { mockLogger } from '../helpers';

enum PublisherType {
  LOCAL = 'local',
  GLOBAL = 'global',
}

@Entity()
class Author {

  @PrimaryKey()
  id!: number;

  @Property()
  name: string;

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

  constructor({ id, name, email }: { id?: number; name: string; email: string }) {
    if (id) {
      this.id = id;
    }
    this.name = name;
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
    new Author({ id : 1, name: 'a', email: 'a@a.com' }),
    new Author({ id: 2, name: 'b', email: 'b@b.com' }),
    new Author({ id: 3, name: 'c', email: 'c@c.com' }),
    new Author({ id: 4, name: 'd', email:  'd@d.com' }),
    new Author({ id: 5, name: 'e', email: 'e@e.com' }),
  ];
  authors[0].friends.add([authors[1], authors[3], authors[4]]);
  authors[0].friends.add([authors[1], authors[3], authors[4]]);
  authors[1].friends.add([authors[0]]);
  authors[2].friends.add([authors[3]]);
  authors[3].friends.add([authors[0], authors[2]]);
  authors[4].friends.add([authors[0]]);
  authors[0].buddies.add([authors[1], authors[3], authors[4]]);
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

  test('groupPrimaryKeysByEntity', () => {
    const map = Utils.groupPrimaryKeysByEntity([
      orm.em.getReference(Author, 1, { wrapped: true }),
      orm.em.getReference(Author, 2, { wrapped: true }),
      orm.em.getReference(Book, 3, { wrapped: true }),
    ] as Ref<any>[]);
    expect(Array.from(map.keys()).length).toBe(2);
    expect(map.has(orm.em.getMetadata().get('Author'))).toBe(true);
    expect(map.has(orm.em.getMetadata().get('Book'))).toBe(true);
    const authorIds = Array.from(map.get(orm.em.getMetadata().get('Author'))!.values());
    const bookIds = Array.from(map.get(orm.em.getMetadata().get('Book'))!.values());
    expect(authorIds.length).toBe(2);
    expect(bookIds.length).toBe(1);
    expect(authorIds.includes(1)).toBe(true);
    expect(authorIds.includes(2)).toBe(true);
    expect(bookIds.includes(3)).toBe(true);
  });

  test('getRefBatchLoadFn', async () => {
    const refBatchLoadFn = Utils.getRefBatchLoadFn(orm.em);
    const mock = mockLogger(orm);
    const res = await refBatchLoadFn(getReferences(orm.em));
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
    expect(refsA).toEqual(refsB);
  });

  test('groupInversedOrMappedKeysByEntity', async () => {
    const collections = await getCollections(orm.em);
    expect(collections).toBeDefined();

    const map = Utils.groupInversedOrMappedKeysByEntity(collections);
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
    const queries = Utils.entitiesMapToQueries(map, orm.em);
    expect(queries).toHaveLength(4);
    for (const query of queries) {
      expect(query instanceof Promise).toBeTruthy();
    }
  });

  test('getColFilter', async () => {
    const promises = Utils.entitiesMapToQueries(new Map([
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
      const filtered = results.filter(Utils.getColFilter(collection));
      expect(filtered.map((el: any) => el.id)).toEqual((await collection.loadItems()).map((el: any) => el.id));
    }
    expect(true).toBeTruthy();
  });

  test('getColBatchLoadFn', async () => {
    const refBatchLoadFn = Utils.getColBatchLoadFn(orm.em);
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
    await Promise.all(colsA.map(ref => ref.loadItems()));
    const mock = mockLogger(orm);
    await Promise.all(colsB.map(ref => ref.load({ dataloader: true })));
    await orm.em.flush();
    expect(mock.mock.calls).toMatchSnapshot();
    expect(colsA.length).toBe(colsB.length);
    for (const [colA, colB] of colsA.map((colA, i) => [colA, colsB[i]])) {
      expect(colA.isInitialized()).toBe(true);
      expect(colB.isInitialized()).toBe(true);
      expect(colA.getItems().map(el => helper(el).getPrimaryKey())).toEqual(colB.getItems().map(el => helper(el).getPrimaryKey()));
    }
  });

  afterAll(async () => orm.close(true));

});
