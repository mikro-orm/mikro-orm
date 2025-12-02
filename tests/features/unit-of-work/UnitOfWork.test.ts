import { Author } from '../../entities/index.js';
import type { ChangeSet, ChangeSetComputer, EventSubscriber, FlushEventArgs, MikroORM } from '@mikro-orm/core';
import { ChangeSetType, IdentityMap, UnitOfWork } from '@mikro-orm/core';
import { initORMMongo, mockLogger } from '../../bootstrap.js';
import FooBar from '../../entities/FooBar.js';
import { FooBaz } from '../../entities/FooBaz.js';
import { Dummy } from '../../entities/Dummy.js';

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
  beforeEach(async () => orm.schema.clear());

  test('changeSet is null for empty payload', async () => {
    const author = orm.em.create(Author, { id: '00000001885f0a3cc37dc9f0', name: 'test', email: 'test' });
    expect(uow.getIdentityMap().get('Author-00000001885f0a3cc37dc9f0')).toBeUndefined();
    uow.merge(author); // add entity to IM first
    const changeSet = computer.computeChangeSet(author); // then try to persist it again
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
    const changeSet = computer.computeChangeSet(dummy);
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
    await em.persist(bar).flush();
    expect(mock.mock.calls[0][0]).toMatch(`db.getCollection('foo-baz').insertMany([ { name: 'dynamic' } ], {})`);
    expect(mock.mock.calls[1][0]).toMatch(/db\.getCollection\('foo-bar'\)\.insertMany\(\[ { name: 'bar', onCreateTest: true, onUpdateTest: true, baz: ObjectId\('\w+'\), version: ISODate\('.+'\) } ], {}\)/);

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
