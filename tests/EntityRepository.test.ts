import { Configuration, QueryOrder } from '@mikro-orm/core';
import { EntityRepository } from '@mikro-orm/knex';
import { Author, Publisher } from './entities/index.js';
import { MongoDriver, MongoEntityRepository } from '@mikro-orm/mongodb';

const methods = {
  getReference: vi.fn(),
  createQueryBuilder: vi.fn(),
  qb: vi.fn(),
  findOne: vi.fn(),
  findOneOrFail: vi.fn(),
  upsert: vi.fn(),
  upsertMany: vi.fn(),
  find: vi.fn(),
  findAndCount: vi.fn(),
  findByCursor: vi.fn(),
  canPopulate: vi.fn(),
  populate: vi.fn(),
  count: vi.fn(),
  create: vi.fn(),
  assign: vi.fn(),
  insert: vi.fn(),
  insertMany: vi.fn(),
  nativeUpdate: vi.fn(),
  nativeDelete: vi.fn(),
  aggregate: vi.fn(),
  config: new Configuration({ driver: MongoDriver }, false),
  getContext: () => undefined as any,
};
const em = vi.fn(() => methods as any)();
methods.getContext = () => em;
const repo = new EntityRepository(em, Publisher);

const emMongo = vi.fn(() => methods as any)();
const repoMongo = new MongoEntityRepository(emMongo, Publisher);

describe('EntityRepository', () => {

  test('should forward calls to EntityManager', async () => {
    repo.getReference('bar');
    expect(methods.getReference.mock.calls[0]).toEqual([Publisher, 'bar', undefined]);
    const e = Object.create(Publisher.prototype);
    await repo.find({ name: 'bar' });
    expect(methods.find.mock.calls[0]).toEqual([Publisher, { name: 'bar' }, undefined]);
    await repo.findAndCount({ name: 'bar' });
    expect(methods.findAndCount.mock.calls[0]).toEqual([Publisher, { name: 'bar' }, undefined]);
    await repo.findByCursor({ name: 'bar' }, { first: 10, after: '...' });
    expect(methods.findByCursor.mock.calls[0]).toEqual([Publisher, { name: 'bar' }, { first: 10, after: '...' }]);
    await repo.findOne('bar');
    expect(methods.findOne.mock.calls[0]).toEqual([Publisher, 'bar', undefined]);
    await repo.findOneOrFail('bar');
    expect(methods.findOneOrFail.mock.calls[0]).toEqual([Publisher, 'bar', undefined]);
    await repo.upsert({ name: 'bar', id: '1' });
    expect(methods.upsert.mock.calls[0]).toEqual([Publisher, { name: 'bar', id: '1' }, undefined]);
    await repo.upsertMany([{ name: 'bar', id: '1' }]);
    expect(methods.upsertMany.mock.calls[0]).toEqual([Publisher, [{ name: 'bar', id: '1' }], undefined]);
    repo.createQueryBuilder();
    expect(methods.createQueryBuilder.mock.calls[0]).toEqual([Publisher, undefined]);
    await repo.qb();
    expect(methods.createQueryBuilder.mock.calls[0]).toEqual([Publisher, undefined]);
    repo.create({ name: 'bar' });
    expect(methods.create.mock.calls[0]).toEqual([Publisher, { name: 'bar' }, undefined]);
    await repo.assign(e, { name: 'bar' });
    expect(methods.assign.mock.calls[0]).toEqual([e, { name: 'bar' }, undefined]);
    await repo.populate([] as Publisher[], ['books']);
    expect(methods.populate.mock.calls[0]).toEqual([[], ['books'], undefined]);

    await repo.insert({ name: 'bar' });
    expect(methods.insert.mock.calls[0]).toEqual([Publisher, { name: 'bar' }, undefined]);
    await repo.insertMany([{ name: 'bar' }]);
    expect(methods.insertMany.mock.calls[0]).toEqual([Publisher, [{ name: 'bar' }], undefined]);
    await repo.nativeUpdate({ name: 'bar' }, { name: 'baz' });
    expect(methods.nativeUpdate.mock.calls[0]).toEqual([Publisher, { name: 'bar' }, { name: 'baz' }, undefined]);
    await repo.nativeDelete({ name: 'bar' });
    expect(methods.nativeDelete.mock.calls[0]).toEqual([Publisher, { name: 'bar' }, undefined]);
    await repoMongo.aggregate([{ name: 'bar' }]);
    expect(methods.aggregate.mock.calls[0]).toEqual([Publisher, [{ name: 'bar' }]]);
  });

  test('find() supports calling with config object', async () => {
    const options = {
      populate: ['tests'] as const,
      orderBy: { tests: QueryOrder.DESC },
      limit: 123,
      offset: 321,
    };
    methods.find.mockReset();
    await repo.find({ name: 'bar' }, options);
    expect(methods.find.mock.calls[0]).toEqual([Publisher, { name: 'bar' }, options]);
  });

  test('findOne() supports calling with config object', async () => {
    const options = {
      populate: ['tests'] as const,
      orderBy: { tests: QueryOrder.DESC },
    };
    methods.findOne.mockReset();
    await repo.findOne({ name: 'bar' }, options);
    expect(methods.findOne.mock.calls[0]).toEqual([Publisher, { name: 'bar' }, options]);
  });

  test('findOneOrFail() supports calling with config object', async () => {
    const options = {
      populate: ['tests'] as const,
      orderBy: { tests: QueryOrder.DESC },
      handler: () => new Error('Test'),
    };
    methods.findOneOrFail.mockReset();
    await repo.findOneOrFail({ name: 'bar' }, options);
    expect(methods.findOneOrFail.mock.calls[0]).toEqual([Publisher, { name: 'bar' }, options]);
  });

  test('assign() and populate() validates entity type', async () => {
    const e = Object.create(Author.prototype, {});
    await expect(repo.populate(e, [])).rejects.toThrow(`Trying to use EntityRepository.populate() with 'Author' entity while the repository is of type 'Publisher'`);
    expect(() => repo.assign(e, {})).toThrow(`Trying to use EntityRepository.assign() with 'Author' entity while the repository is of type 'Publisher'`);
  });

  test('getEntityName() returns the correct value', async () => {
    expect(repoMongo.getEntityName()).toEqual(Publisher.name);
  });

});
