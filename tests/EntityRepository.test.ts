import { EntityRepository, EntityManager, IEntity, Configuration } from '../lib';
import { Publisher } from './entities';

const methods = {
  getReference: jest.fn(),
  persist: jest.fn(),
  persistAndFlush: jest.fn(),
  persistLater: jest.fn(),
  createQueryBuilder: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
  remove: jest.fn(),
  removeAndFlush: jest.fn(),
  removeLater: jest.fn(),
  flush: jest.fn(),
  canPopulate: jest.fn(),
  count: jest.fn(),
  create: jest.fn(),
  nativeInsert: jest.fn(),
  nativeUpdate: jest.fn(),
  nativeDelete: jest.fn(),
  aggregate: jest.fn(),
  config: new Configuration({ autoFlush: true } as any, false),
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
    await repo.persistAndFlush(e);
    expect(methods.persistAndFlush.mock.calls[0]).toEqual([e]);
    repo.persistLater(e);
    expect(methods.persistLater.mock.calls[0]).toEqual([e]);
    await repo.find({ foo: 'bar' });
    expect(methods.find.mock.calls[0]).toEqual([Publisher, { foo: 'bar' }, [], {}, undefined, undefined]);
    await repo.findOne('bar');
    expect(methods.findOne.mock.calls[0]).toEqual([Publisher, 'bar', []]);
    await repo.createQueryBuilder();
    expect(methods.createQueryBuilder.mock.calls[0]).toEqual([Publisher]);
    await repo.remove('bar');
    expect(methods.remove.mock.calls[0]).toEqual([Publisher, 'bar', true]);
    const entity = {} as IEntity;
    await repo.removeAndFlush(entity);
    expect(methods.removeAndFlush.mock.calls[0]).toEqual([entity]);
    repo.removeLater(entity);
    expect(methods.removeLater.mock.calls[0]).toEqual([entity]);
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

  test('find() supports calling with config object', async () => {
    const options = {
      populate: ['test'],
      orderBy: { test: -1 },
      limit: 123,
      offset: 321,
    };
    methods.find.mock.calls = [];
    await repo.find({ foo: 'bar' }, options);
    expect(methods.find.mock.calls[0]).toEqual([Publisher, { foo: 'bar' }, options, {}, undefined, undefined]);
  });

});
