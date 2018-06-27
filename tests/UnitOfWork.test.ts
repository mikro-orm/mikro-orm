import { UnitOfWork } from '../lib/UnitOfWork';
import { Author } from './entities/Author';
import { MikroORM } from '../lib';
import { initORM, wipeDatabase } from './bootstrap';

/**
 * @class UnitOfWorkTest
 */
describe('UnitOfWork', () => {

  let orm: MikroORM;
  let uow: UnitOfWork;

  beforeAll(async () => {
    orm = await initORM();
    uow = new UnitOfWork(orm.em);
  });
  beforeEach(async () => wipeDatabase(orm.em));

  test('entity validation when persisting [not strict]', async () => {
    // number instead of string will throw
    const author = new Author('test', 'test');
    Object.assign(author, { name: 111, email: 222 });
    await expect(uow.persist(author)).rejects.toThrowError(`Validation error: trying to set Author.name of type 'string' to '111' of type 'number'`);

    // string date with unknown format will throw
    Object.assign(author, { name: '333', email: '444', born: 'asd' });
    await expect(uow.persist(author)).rejects.toThrowError(`Validation error: trying to set Author.born of type 'date' to 'asd' of type 'string'`);

    // string date with correct format will be auto-corrected
    Object.assign(author, { name: '333', email: '444', born: '2018-01-01' });
    let changeSet = await uow.persist(author);
    expect(typeof changeSet.payload.name).toBe('string');
    expect(typeof changeSet.payload.email).toBe('string');
    expect(changeSet.payload.born instanceof Date).toBe(true);

    // string number with correct format will be auto-corrected
    Object.assign(author, { age: '21' });
    changeSet = await uow.persist(author);
    expect(typeof changeSet.payload.age).toBe('number');
    expect(changeSet.payload.age).toBe(21);

    // string instead of number with will throw
    Object.assign(author, { age: 'asd' });
    await expect(uow.persist(author)).rejects.toThrowError(`Validation error: trying to set Author.age of type 'number' to 'asd' of type 'string'`);
    Object.assign(author, { age: new Date() });
    await expect(uow.persist(author)).rejects.toThrowError(/Validation error: trying to set Author\.age of type 'number' to '.*' of type 'date'/);
    Object.assign(author, { age: false });
    await expect(uow.persist(author)).rejects.toThrowError(`Validation error: trying to set Author.age of type 'number' to 'false' of type 'boolean'`);
  });

  afterAll(async () => orm.close(true));

});
