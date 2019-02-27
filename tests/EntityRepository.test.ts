import { EntityRepository, EntityManager } from '../lib';
import { Publisher } from './entities';

const methods = {
  getReference: jest.fn(),
  persist: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
  remove: jest.fn(),
  flush: jest.fn(),
  canPopulate: jest.fn(),
  count: jest.fn(),
  create: jest.fn(),
  nativeInsert: jest.fn(),
  nativeUpdate: jest.fn(),
  nativeDelete: jest.fn(),
  aggregate: jest.fn(),
  options: { autoFlush: true },
};
const Mock = jest.fn<EntityManager, any>(() => methods as any);
const em = new Mock();
const repo = new EntityRepository(em, Publisher);

/**
 * @class EntityRepositoryTest
 */
describe('EntityRepository', () => {

  test('should forward calls to EntityManager', async () => {
    repo.getReference('bar');
    expect(methods.getReference.mock.calls[0]).toEqual([Publisher, 'bar']);
    const e = Object.create(Publisher.prototype);
    await repo.persist(e, false);
    expect(methods.persist.mock.calls[0]).toEqual([e, false]);
    await repo.find({ foo: 'bar' });
    expect(methods.find.mock.calls[0]).toEqual([Publisher, { foo: 'bar' }, [], {}, undefined, undefined]);
    await repo.findOne('bar');
    expect(methods.findOne.mock.calls[0]).toEqual([Publisher, 'bar', []]);
    await repo.remove('bar');
    expect(methods.remove.mock.calls[0]).toEqual([Publisher, 'bar', true]);
    await repo.create({ name: 'bar' });
    expect(methods.create.mock.calls[0]).toEqual([Publisher, { name: 'bar' }]);

    await repo.nativeInsert({ foo: 'bar' });
    expect(methods.nativeInsert.mock.calls[0]).toEqual([Publisher, { foo: 'bar' }]);
    await repo.nativeUpdate({ foo: 'bar' }, { foo: 'baz' });
    expect(methods.nativeUpdate.mock.calls[0]).toEqual([Publisher, { foo: 'bar' }, { foo: 'baz' }]);
    await repo.nativeDelete({ foo: 'bar' });
    expect(methods.nativeDelete.mock.calls[0]).toEqual([Publisher, { foo: 'bar' }]);
    await repo.aggregate([{ foo: 'bar' }]);
    expect(methods.aggregate.mock.calls[0]).toEqual([Publisher, [{ foo: 'bar' }]]);
  });

});
