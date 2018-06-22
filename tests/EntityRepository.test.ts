import { EntityRepository } from '../lib';
import { EntityManager } from '../lib';
import { Publisher } from './entities/Publisher';

const methods = {
  getReference: jest.fn(),
  persist: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
  remove: jest.fn(),
  flush: jest.fn(),
  canPopulate: jest.fn(),
  count: jest.fn(),
};
const Mock = jest.fn<EntityManager>(() => methods);
const em = new Mock();
const repo = new EntityRepository<Publisher>(em, Publisher.name);

/**
 * @class EntityRepositoryTest
 */
describe('EntityRepository', () => {

  test('should forward calls to EntityManager', async () => {
    repo.getReference('bar');
    expect(methods.getReference.mock.calls[0]).toEqual([Publisher.name, 'bar']);
    const e = Object.create(Publisher.prototype);
    await repo.persist(e, false);
    expect(methods.persist.mock.calls[0]).toEqual([e, false]);
    await repo.find({ foo: 'bar' });
    expect(methods.find.mock.calls[0]).toEqual([Publisher.name, { foo: 'bar' }, [], {}, null, null]);
    await repo.findOne('bar');
    expect(methods.findOne.mock.calls[0]).toEqual([Publisher.name, 'bar', []]);
    await repo.remove('bar');
    expect(methods.remove.mock.calls[0]).toEqual([Publisher.name, 'bar']);
  });

});
