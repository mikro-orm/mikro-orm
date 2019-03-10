import { Author } from './entities';
import { MikroORM } from '../lib';
import { UnitOfWork, ChangeSetComputer } from '../lib/unit-of-work';
import { initORM, wipeDatabase } from './bootstrap';

/**
 * @class UnitOfWorkTest
 */
describe('UnitOfWork', () => {

  let orm: MikroORM;
  let uow: UnitOfWork;
  let computer: ChangeSetComputer;

  beforeAll(async () => {
    orm = await initORM();
    uow = new UnitOfWork(orm.em);
    computer = uow['changeSetComputer'];
  });
  beforeEach(async () => wipeDatabase(orm.em));

  test('entity validation when persisting [not strict]', async () => {
    // number instead of string will throw
    const author = new Author('test', 'test');
    Object.assign(author, { name: 111, email: 222 });
    expect(() => computer.computeChangeSet(author)).toThrowError(`Trying to set Author.name of type 'string' to '111' of type 'number'`);

    // string date with unknown format will throw
    Object.assign(author, { name: '333', email: '444', born: 'asd' });
    expect(() => computer.computeChangeSet(author)).toThrowError(`Trying to set Author.born of type 'date' to 'asd' of type 'string'`);

    // number bool with other value than 0/1 will throw
    Object.assign(author, { termsAccepted: 2 });
    expect(() => computer.computeChangeSet(author)).toThrowError(`Trying to set Author.termsAccepted of type 'boolean' to '2' of type 'number'`);

    // string date with correct format will be auto-corrected
    Object.assign(author, { name: '333', email: '444', born: '2018-01-01', termsAccepted: 1 });
    let changeSet = computer.computeChangeSet(author)!;
    expect(typeof changeSet.payload.name).toBe('string');
    expect(changeSet.payload.name).toBe('333');
    expect(typeof changeSet.payload.email).toBe('string');
    expect(changeSet.payload.email).toBe('444');
    expect(typeof changeSet.payload.termsAccepted).toBe('boolean');
    expect(changeSet.payload.termsAccepted).toBe(true);
    expect(changeSet.payload.born instanceof Date).toBe(true);

    // Date object will be ok
    Object.assign(author, { born: new Date() });
    changeSet = (await computer.computeChangeSet(author))!;
    expect(changeSet.payload.born instanceof Date).toBe(true);

    // null will be ok
    Object.assign(author, { born: null });
    changeSet = (await computer.computeChangeSet(author))!;
    expect(changeSet.payload.born).toBeNull();

    // string number with correct format will be auto-corrected
    Object.assign(author, { age: '21' });
    changeSet = (await computer.computeChangeSet(author))!;
    expect(typeof changeSet.payload.age).toBe('number');
    expect(changeSet.payload.age).toBe(21);

    // string instead of number with will throw
    Object.assign(author, { age: 'asd' });
    expect(() => computer.computeChangeSet(author)).toThrowError(`Trying to set Author.age of type 'number' to 'asd' of type 'string'`);
    Object.assign(author, { age: new Date() });
    expect(() => computer.computeChangeSet(author)).toThrowError(/Trying to set Author\.age of type 'number' to '.*' of type 'date'/);
    Object.assign(author, { age: false });
    expect(() => computer.computeChangeSet(author)).toThrowError(`Trying to set Author.age of type 'number' to 'false' of type 'boolean'`);

    // missing collection instance in m:n and 1:m relations
    delete author.books;
    expect(() => computer.computeChangeSet(author)).toThrowError(`Author.books is not initialized, define it as 'books = new Collection<Book>(this);'`);
  });

  test('changeSet is null for empty payload', async () => {
    const author = new Author('test', 'test');
    author.id = '00000001885f0a3cc37dc9f0';
    uow.addToIdentityMap(author); // add entity to IM first
    const changeSet = await computer.computeChangeSet(author); // then try to persist it again
    expect(changeSet).toBeNull();
    expect(uow.getIdentityMap()).not.toEqual({});
    uow.clear();
    expect(uow.getIdentityMap()).toEqual({});
  });

  test('persist and remove will add entity to given stack only once', async () => {
    const author = new Author('test', 'test');
    author.id = '00000001885f0a3cc37dc9f0';
    uow.persist(author);
    expect(uow['persistStack'].length).toBe(1);
    uow.persist(author);
    expect(uow['persistStack'].length).toBe(1);
    uow.remove(author);
    expect(uow['persistStack'].length).toBe(0);
    expect(uow['removeStack'].length).toBe(1);
    uow.remove(author);
    expect(uow['removeStack'].length).toBe(1);
  });

  afterAll(async () => orm.close(true));

});
