import { Author } from '../../entities';
import type { ChangeSet, ChangeSetComputer, EventSubscriber, FlushEventArgs, MikroORM } from '@mikro-orm/core';
import { ChangeSetType, EntityValidator, IdentityMap, UnitOfWork } from '@mikro-orm/core';
import { initORMMongo, mockLogger } from '../../bootstrap';
import FooBar from '../../entities/FooBar';
import { FooBaz } from '../../entities/FooBaz';
import { Dummy } from '../../entities/Dummy';

describe('UnitOfWork', () => {

  let orm: MikroORM;
  let uow: UnitOfWork;
  let computer: ChangeSetComputer;

  beforeAll(async () => {
    orm = await initORMMongo();
    uow = new UnitOfWork(orm.em);
    // @ts-ignore
    computer = uow.changeSetComputer;
  });
  beforeEach(async () => orm.schema.clearDatabase());

  test('entity validation when persisting [not strict]', async () => {
    // number instead of string will throw
    const author = new Author('test', 'test');
    Object.assign(author, { name: 111, email: 222 });
    expect(() => computer.computeChangeSet(author)).toThrow(`Trying to set Author.name of type 'string' to 111 of type 'number'`);

    // string date with unknown format will throw
    Object.assign(author, { name: '333', email: '444', createdAt: 'asd' });
    expect(() => computer.computeChangeSet(author)).toThrow(`Trying to set Author.createdAt of type 'Date' to 'asd' of type 'string'`);
    delete author.createdAt;

    // number bool with other value than 0/1 will throw
    Object.assign(author, { termsAccepted: 2 });
    expect(() => computer.computeChangeSet(author)).toThrow(`Trying to set Author.termsAccepted of type 'boolean' to 2 of type 'number'`);

    // string date with correct format will be auto-corrected
    Object.assign(author, { name: '333', email: '444', createdAt: '2018-01-01', termsAccepted: 1 });
    let changeSet = computer.computeChangeSet(author)!;
    expect(typeof changeSet.payload.name).toBe('string');
    expect(changeSet.payload.name).toBe('333');
    expect(typeof changeSet.payload.email).toBe('string');
    expect(changeSet.payload.email).toBe('444');
    expect(typeof changeSet.payload.termsAccepted).toBe('boolean');
    expect(changeSet.payload.termsAccepted).toBe(true);
    expect(changeSet.payload.createdAt instanceof Date).toBe(true);

    // Date object will be ok
    Object.assign(author, { createdAt: new Date() });
    changeSet = (await computer.computeChangeSet(author))!;
    expect(changeSet.payload.createdAt instanceof Date).toBe(true);

    // null will be ok
    Object.assign(author, { createdAt: null });
    changeSet = (await computer.computeChangeSet(author))!;
    expect(changeSet.payload.createdAt).toBeNull();

    // string number with correct format will be auto-corrected
    Object.assign(author, { age: '21' });
    changeSet = (await computer.computeChangeSet(author))!;
    expect(typeof changeSet.payload.age).toBe('number');
    expect(changeSet.payload.age).toBe(21);

    // string instead of number with will throw
    Object.assign(author, { age: 'asd' });
    expect(() => computer.computeChangeSet(author)).toThrow(`Trying to set Author.age of type 'number' to 'asd' of type 'string'`);
    Object.assign(author, { age: new Date() });
    expect(() => computer.computeChangeSet(author)).toThrow(/Trying to set Author\.age of type 'number' to .* of type 'Date'/);
    Object.assign(author, { age: false });
    expect(() => computer.computeChangeSet(author)).toThrow(`Trying to set Author.age of type 'number' to false of type 'boolean'`);
    author.age = 21;

    // missing collection instance in m:n and 1:m relations
    // @ts-ignore
    delete author.books;
    expect(() => computer.computeChangeSet(author)).toThrow(`Author.books is not initialized, define it as 'books = new Collection<Book>(this);'`);
  });

  test('entity validation when persisting [strict]', async () => {
    const validator = new EntityValidator(true);
    const author = new Author('test', 'test');

    // string date with correct format will not be auto-corrected in strict mode
    const payload = { name: '333', email: '444', createdAt: '2018-01-01', termsAccepted: 1 };
    expect(() => validator.validate(author, payload, orm.getMetadata().get(Author.name))).toThrow(`Trying to set Author.createdAt of type 'Date' to '2018-01-01' of type 'string'`);
  });

  test('changeSet is null for empty payload', async () => {
    const author = orm.em.create(Author, { id: '00000001885f0a3cc37dc9f0', name: 'test', email: 'test' });
    expect(uow.getIdentityMap().get('Author-00000001885f0a3cc37dc9f0')).toBeUndefined();
    uow.merge(author); // add entity to IM first
    const changeSet = await computer.computeChangeSet(author); // then try to persist it again
    expect(changeSet).toBeNull();
    expect(uow.getIdentityMap()).not.toEqual(new IdentityMap());
    expect(uow.getIdentityMap().get('Author-00000001885f0a3cc37dc9f0')).not.toBeUndefined();
    expect(uow.getIdentityMap().get('Author-00000001885f0a3cc37dc9f2')).toBeUndefined();
    uow.clear();
    expect(uow.getIdentityMap()).toEqual(new IdentityMap());
    expect(uow.getIdentityMap().get('Author-00000001885f0a3cc37dc9f0')).toBeUndefined();
  });

  test('changeSet is null for readonly entity', async () => {
    const dummy = new Dummy();
    uow.merge(dummy);
    const changeSet = await computer.computeChangeSet(dummy);
    expect(changeSet).toBeNull();
  });

  test('persist and remove will add entity to given stack only once', async () => {
    const author = orm.em.create(Author, { id: '00000001885f0a3cc37dc9f0', name: 'test', email: 'test' });
    uow.persist(author);
    expect(uow.getPersistStack().size).toBe(1);
    uow.persist(author);
    expect(uow.getPersistStack().size).toBe(1);
    uow.remove(author);
    expect(uow.getPersistStack().size).toBe(0);
    uow.remove(author);
    expect(uow.getRemoveStack().size).toBe(1);
    uow.remove(author);
    expect(uow.getRemoveStack().size).toBe(1);
    expect(uow.getCollectionUpdates().length).toBe(0);
    expect(uow.getExtraUpdates().size).toBe(0);
  });

  test('getters', async () => {
    const uow = new UnitOfWork(orm.em);
    const author = orm.em.create(Author, { id: '00000001885f0a3cc37dc9f0', name: 'test', email: 'test' }, { managed: true });
    uow.persist(author);
    expect([...uow.getPersistStack()]).toEqual([author]);
    expect([...uow.getRemoveStack()]).toEqual([]);
    uow.remove(author);
    expect([...uow.getRemoveStack()]).toEqual([author]);
    expect(() => uow.recomputeSingleChangeSet(author)).not.toThrow();
    expect(() => uow.computeChangeSet(author)).not.toThrow();
    expect(() => uow.recomputeSingleChangeSet(author)).not.toThrow();
    expect(() => uow.computeChangeSet(author)).not.toThrow();
  });

  test('manually changing the UoW state during flush', async () => {
    let changeSets: ChangeSet<any>[] = [];

    class Subscriber implements EventSubscriber {

      async onFlush(args: FlushEventArgs): Promise<void> {
        const changeSets = args.uow.getChangeSets();
        const cs = changeSets.find(cs => cs.type === ChangeSetType.CREATE && cs.entity instanceof FooBar);

        if (cs) {
          const baz = new FooBaz();
          baz.name = 'dynamic';
          cs.entity.baz = baz;
          args.uow.computeChangeSet(baz);
          args.uow.recomputeSingleChangeSet(cs.entity);
        }

        const toRemove = changeSets.find(cs => cs.entity instanceof FooBar && cs.entity.name === 'remove me');

        if (toRemove) {
          args.uow.computeChangeSet(toRemove.entity, ChangeSetType.DELETE);
        }
      }

      async afterFlush(args: FlushEventArgs): Promise<void> {
        changeSets = [...args.uow.getChangeSets()];
      }

    }

    const em = orm.em.fork();
    em.getEventManager().registerSubscriber(new Subscriber());
    const bar = new FooBar();
    bar.name = 'bar';

    const mock = mockLogger(orm);
    await em.persistAndFlush(bar);
    expect(mock.mock.calls[0][0]).toMatch(`db.getCollection('foo-baz').insertMany([ { name: 'dynamic' } ], {})`);
    expect(mock.mock.calls[1][0]).toMatch(/db\.getCollection\('foo-bar'\)\.insertMany\(\[ { name: 'bar', onCreateTest: true, onUpdateTest: true, baz: ObjectId\('\w+'\) } ], {}\)/);

    expect(changeSets.map(cs => [cs.type, cs.name])).toEqual([
      [ChangeSetType.CREATE, 'FooBar'],
      [ChangeSetType.CREATE, 'FooBaz'],
    ]);
    mock.mockReset();

    bar.name = 'remove me';
    await em.flush();
    expect(mock.mock.calls[0][0]).toMatch(/db\.getCollection\('foo-bar'\)\.deleteMany\(\{ _id: \{ '\$in': \[ ObjectId\('\w{24}'\) ] } }, \{}\)/);
    expect(changeSets.map(cs => [cs.type, cs.name])).toEqual([
      [ChangeSetType.DELETE, 'FooBar'],
    ]);
  });

  afterAll(async () => orm.close(true));

});
