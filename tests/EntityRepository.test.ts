import { Configuration, QueryOrder, AnyEntity } from '@mikro-orm/core';
import { EntityManager, EntityRepository } from '@mikro-orm/knex';
import { Publisher } from './entities';
import { MongoEntityManager, MongoEntityRepository } from '@mikro-orm/mongodb';

const methods = {
  getReference: jest.fn(),
  persist: jest.fn(),
  persistAndFlush: jest.fn(),
  persistLater: jest.fn(),
  createQueryBuilder: jest.fn(),
  findOne: jest.fn(),
  findOneOrFail: jest.fn(),
  find: jest.fn(),
  findAndCount: jest.fn(),
  remove: jest.fn(),
  removeAndFlush: jest.fn(),
  removeLater: jest.fn(),
  flush: jest.fn(),
  canPopulate: jest.fn(),
  populate: jest.fn(),
  count: jest.fn(),
  create: jest.fn(),
  nativeInsert: jest.fn(),
  nativeUpdate: jest.fn(),
  nativeDelete: jest.fn(),
  aggregate: jest.fn(),
  config: new Configuration({ type: 'mongo' } as any, false),
};
const Mock = jest.fn<EntityManager, any>(() => methods as any);
const em = new Mock();
const repo = new EntityRepository(em, Publisher);

const MongoMock = jest.fn<MongoEntityManager, any>(() => methods as any);
const emMongo = new MongoMock();
const repoMongo = new MongoEntityRepository(emMongo, Publisher);

describe('EntityRepository', () => {

  test('should forward calls to EntityManager', async () => {
    repo.getReference('bar');
    expect(methods.getReference.mock.calls[0]).toEqual([Publisher, 'bar', false]);
    const e = Object.create(Publisher.prototype);
    repo.persist(e);
    expect(methods.persist.mock.calls[0]).toEqual([e]);
    await repo.persistAndFlush(e);
    expect(methods.persistAndFlush.mock.calls[0]).toEqual([e]);
    repo.persistLater(e);
    expect(methods.persistLater.mock.calls[0]).toEqual([e]);
    await repo.find({ name: 'bar' });
    expect(methods.find.mock.calls[0]).toEqual([Publisher, { name: 'bar' }, [], {}, undefined, undefined]);
    await repo.findAndCount({ name: 'bar' });
    expect(methods.findAndCount.mock.calls[0]).toEqual([Publisher, { name: 'bar' }, [], {}, undefined, undefined]);
    await repo.findOne('bar');
    expect(methods.findOne.mock.calls[0]).toEqual([Publisher, 'bar', undefined, undefined]);
    await repo.findOneOrFail('bar');
    expect(methods.findOneOrFail.mock.calls[0]).toEqual([Publisher, 'bar', undefined, undefined]);
    await repo.createQueryBuilder();
    expect(methods.createQueryBuilder.mock.calls[0]).toEqual([Publisher, undefined]);
    repo.remove(e);
    expect(methods.remove.mock.calls[0]).toEqual([e]);
    const entity = {} as AnyEntity;
    await repo.removeAndFlush(entity);
    expect(methods.removeAndFlush.mock.calls[0]).toEqual([entity]);
    repo.removeLater(entity);
    expect(methods.removeLater.mock.calls[0]).toEqual([entity]);
    await repo.create({ name: 'bar' });
    expect(methods.create.mock.calls[0]).toEqual([Publisher, { name: 'bar' }]);
    await repo.populate([], 'bar');
    expect(methods.populate.mock.calls[0]).toEqual([[], 'bar', {}, {}, false, true]);

    await repo.nativeInsert({ name: 'bar' });
    expect(methods.nativeInsert.mock.calls[0]).toEqual([Publisher, { name: 'bar' }]);
    await repo.nativeUpdate({ name: 'bar' }, { name: 'baz' });
    expect(methods.nativeUpdate.mock.calls[0]).toEqual([Publisher, { name: 'bar' }, { name: 'baz' }]);
    await repo.nativeDelete({ name: 'bar' });
    expect(methods.nativeDelete.mock.calls[0]).toEqual([Publisher, { name: 'bar' }]);
    await repoMongo.aggregate([{ name: 'bar' }]);
    expect(methods.aggregate.mock.calls[0]).toEqual([Publisher, [{ name: 'bar' }]]);
  });

  test('find() supports calling with config object', async () => {
    const options = {
      populate: ['test'],
      orderBy: { test: QueryOrder.DESC },
      limit: 123,
      offset: 321,
    };
    methods.find.mock.calls = [];
    await repo.find({ name: 'bar' }, options);
    expect(methods.find.mock.calls[0]).toEqual([Publisher, { name: 'bar' }, options, {}, undefined, undefined]);
  });

  test('findOne() supports calling with config object', async () => {
    const options = {
      populate: ['test'],
      orderBy: { test: QueryOrder.DESC },
    };
    methods.findOne.mock.calls = [];
    await repo.findOne({ name: 'bar' }, options);
    expect(methods.findOne.mock.calls[0]).toEqual([Publisher, { name: 'bar' }, options, undefined]);
  });

  test('findOneOrFail() supports calling with config object', async () => {
    const options = {
      populate: ['test'],
      orderBy: { test: QueryOrder.DESC },
      handler: () => new Error('Test'),
    };
    methods.findOneOrFail.mock.calls = [];
    await repo.findOneOrFail({ name: 'bar' }, options);
    expect(methods.findOneOrFail.mock.calls[0]).toEqual([Publisher, { name: 'bar' }, options, undefined]);
  });

});
