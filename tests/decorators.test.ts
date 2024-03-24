import {
  ManyToMany,
  ManyToOne,
  MikroORM,
  OneToMany,
  OneToOne,
  Property,
  MetadataStorage,
  ReferenceKind,
  Utils,
  CreateRequestContext,
  EnsureRequestContext,
  RequestContext,
  EntityManager,
  EntityRepository,
} from '@mikro-orm/core';
import type { Dictionary } from '@mikro-orm/core';
import { Test } from './entities';

class Test2 {}
class Test3 {}
class Test4 {}
class Test5 {}
class Test6 {}
const TEST_VALUE = 'expected value';

const DI = {} as Dictionary;

const ASYNC_ORM: Promise<MikroORM> =  Promise.resolve(Object.create(MikroORM.prototype, { em: { value: { name: 'default', fork: jest.fn() } } }));

class TestClass {

  constructor(private readonly orm: MikroORM) {}

  @CreateRequestContext()
  async asyncMethodReturnsValue() {
    return TEST_VALUE;
  }

  @CreateRequestContext()
  methodReturnsValue() {
    return TEST_VALUE;
  }

  @CreateRequestContext()
  async asyncMethodReturnsNothing() {
    //
  }

  @CreateRequestContext()
  methodReturnsNothing() {
    //
  }

  @CreateRequestContext(() => DI.orm)
  methodWithCallback() {
    //
  }

  @CreateRequestContext(async () => ASYNC_ORM)
  async methodWithAsyncCallback() {
    return TEST_VALUE;
  }

  @CreateRequestContext(ASYNC_ORM)
  async methodWithAsyncOrmInstance() {
    return TEST_VALUE;
  }

}

class TestClass2 {

  constructor(private readonly orm: MikroORM) {}

  @EnsureRequestContext()
  async asyncMethodReturnsValue() {
    return TEST_VALUE;
  }

  @EnsureRequestContext()
  methodReturnsValue() {
    return TEST_VALUE;
  }

  @EnsureRequestContext()
  async asyncMethodReturnsNothing() {
    //
  }

  @EnsureRequestContext()
  methodReturnsNothing() {
    //
  }

  @EnsureRequestContext(() => DI.orm)
  methodWithCallback() {
    //
  }

}

class TestClass3 {

  constructor(private readonly orm: Promise<MikroORM>) {}

  @CreateRequestContext()
  methodWithAsyncOrmPropertyAndReturnsNothing() {
    //
  }

}

class TestClass4 {

  constructor(private readonly em: EntityManager) {}

  @CreateRequestContext()
  foo() {
    //
  }

}

class TestClass5 {

  constructor(private readonly repo: EntityRepository<any>) {}

  @CreateRequestContext<TestClass5>(t => t.repo)
  foo() {
    //
  }

}

describe('decorators', () => {

  const lookupPathFromDecorator = jest.spyOn(Utils, 'lookupPathFromDecorator');
  lookupPathFromDecorator.mockReturnValue('/path/to/entity');

  test('ManyToMany', () => {
    const storage = MetadataStorage.getMetadata();
    const key = 'Test2-' + Utils.hash('/path/to/entity');
    const err = 'Mixing first decorator parameter as options object with other parameters is forbidden. If you want to use the options parameter at first position, provide all options inside it.';
    expect(() => ManyToMany({ entity: () => Test }, 'name')(new Test2(), 'test0')).toThrow(err);
    ManyToMany({ entity: () => Test })(new Test2(), 'test0');
    ManyToMany({ entity: () => Test })(new Test2(), 'test0'); // calling multiple times won't throw
    expect(storage[key].properties.test0).toMatchObject({ kind: ReferenceKind.MANY_TO_MANY, name: 'test0' });
    expect(storage[key].properties.test0.entity()).toBe(Test);
    expect(Object.keys(MetadataStorage.getMetadata())).toHaveLength(7);
    MetadataStorage.clear();
    expect(Object.keys(MetadataStorage.getMetadata())).toHaveLength(0);
  });

  test('ManyToOne', () => {
    const storage = MetadataStorage.getMetadata();
    const key = 'Test3-' + Utils.hash('/path/to/entity');
    ManyToOne({ entity: () => Test })(new Test3(), 'test1');
    ManyToOne({ entity: () => Test })(new Test3(), 'test1'); // calling multiple times won't throw
    expect(storage[key].properties.test1).toMatchObject({ kind: ReferenceKind.MANY_TO_ONE, name: 'test1' });
    expect(storage[key].properties.test1.entity()).toBe(Test);
  });

  test('OneToOne', () => {
    const storage = MetadataStorage.getMetadata();
    const key = 'Test6-' + Utils.hash('/path/to/entity');
    OneToOne({ entity: () => Test, inversedBy: 'test5' } as any)(new Test6(), 'test1');
    expect(storage[key].properties.test1).toMatchObject({ kind: ReferenceKind.ONE_TO_ONE, name: 'test1', inversedBy: 'test5' });
    expect(storage[key].properties.test1.entity()).toBe(Test);
  });

  test('OneToMany', () => {
    const storage = MetadataStorage.getMetadata();
    const key = 'Test4-' + Utils.hash('/path/to/entity');
    OneToMany({ entity: () => Test, mappedBy: 'test' } as any)(new Test4(), 'test2');
    OneToMany({ entity: () => Test, mappedBy: 'test' } as any)(new Test4(), 'test2'); // calling multiple times won't throw
    expect(storage[key].properties.test2).toMatchObject({ kind: ReferenceKind.ONE_TO_MANY, name: 'test2', mappedBy: 'test' });
    expect(storage[key].properties.test2.entity()).toBe(Test);
  });

  test('Property', () => {
    const storage = MetadataStorage.getMetadata();
    const key = 'Test5-' + Utils.hash('/path/to/entity');
    Property()(new Test5(), 'test3');
    expect(storage[key].properties.test3).toMatchObject({ kind: ReferenceKind.SCALAR, name: 'test3' });
  });

  test('babel support', () => {
    const ret1 = Property()(new Test5(), 'test3');
    expect(ret1).toBeUndefined();
    process.env.BABEL_DECORATORS_COMPAT = 'true';
    const ret2 = Property()(new Test5(), 'test3');
    expect(ret2).not.toBeUndefined();
    delete process.env.BABEL_DECORATORS_COMPAT;
    const ret3 = Property()(new Test5(), 'test3');
    expect(ret3).toBeUndefined();
  });

  test('CreateRequestContext', async () => {
    const em = Object.create(EntityManager.prototype, { name: { value: 'default' }, fork: { value: jest.fn() } });
    const repo = Object.create(EntityRepository.prototype, { em: { value: em } });
    const orm = Object.create(MikroORM.prototype, { em: { value: em } });
    const test = new TestClass(orm);

    const ret1 = await test.asyncMethodReturnsValue();
    expect(ret1).toEqual(TEST_VALUE);
    const ret2 = await test.methodReturnsValue();
    expect(ret2).toEqual(TEST_VALUE);
    const ret3 = await test.asyncMethodReturnsNothing();
    expect(ret3).toBeUndefined();
    const ret4 = await test.methodReturnsNothing();
    expect(ret4).toBeUndefined();
    const ret5 = await test.methodWithCallback();
    expect(ret5).toBeUndefined();

    const notOrm = jest.fn() as unknown as MikroORM;
    const test2 = new TestClass(notOrm);
    DI.orm = orm;
    const ret6 = await test2.methodWithCallback();
    expect(ret6).toBeUndefined();

    const err = '@CreateRequestContext() decorator can only be applied to methods of classes with `orm: MikroORM` property, `em: EntityManager` property, or with a callback parameter like `@CreateRequestContext(() => orm)` that returns one of those types. The parameter will contain a reference to current `this`. Returning an EntityRepository from it is also supported.';
    await expect(test2.asyncMethodReturnsValue()).rejects.toThrow(err);
    const ret7 = await test.methodWithAsyncCallback();
    expect(ret7).toEqual(TEST_VALUE);
    const ret8 = await test.methodWithAsyncOrmInstance();
    expect(ret8).toEqual(TEST_VALUE);

    const test3 = new TestClass3(ASYNC_ORM);
    const ret9 = await test3.methodWithAsyncOrmPropertyAndReturnsNothing();
    expect(ret9).toBeUndefined();

    const test4 = new TestClass4(em);
    const ret10 = await test4.foo();
    expect(ret10).toBeUndefined();

    const test5 = new TestClass5(repo);
    const ret11 = await test5.foo();
    expect(ret11).toBeUndefined();
  });

  test('EnsureRequestContext', async () => {
    const orm = Object.create(MikroORM.prototype, { em: { value: { name: 'default', fork: jest.fn() } } });
    const test = new TestClass2(orm);

    const ret1 = await test.asyncMethodReturnsValue();
    expect(ret1).toEqual(TEST_VALUE);
    const ret2 = await test.methodReturnsValue();
    expect(ret2).toEqual(TEST_VALUE);
    const ret3 = await test.asyncMethodReturnsNothing();
    expect(ret3).toBeUndefined();
    const ret4 = await test.methodReturnsNothing();
    expect(ret4).toBeUndefined();
    const ret5 = await test.methodWithCallback();
    expect(ret5).toBeUndefined();

    const notOrm = jest.fn() as unknown as MikroORM;
    const test2 = new TestClass2(notOrm);
    DI.orm = orm;
    const ret6 = await test2.methodWithCallback();
    expect(ret6).toBeUndefined();

    const err = '@EnsureRequestContext() decorator can only be applied to methods of classes with `orm: MikroORM` property, `em: EntityManager` property, or with a callback parameter like `@EnsureRequestContext(() => orm)` that returns one of those types. The parameter will contain a reference to current `this`. Returning an EntityRepository from it is also supported.';
    await expect(test2.asyncMethodReturnsValue()).rejects.toThrow(err);

    await RequestContext.create(orm.em, async () => {
      await expect(test2.asyncMethodReturnsValue()).resolves.toBe(TEST_VALUE);
    });
  });

});
