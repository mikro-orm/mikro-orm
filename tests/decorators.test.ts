import { ManyToMany, ManyToOne, MikroORM, OneToMany, OneToOne, Property, MetadataStorage, ReferenceType, Utils, Subscriber, UseRequestContext } from '@mikro-orm/core';
import type { Dictionary } from '@mikro-orm/core';
import { Test } from './entities';

class Test2 {}
class Test3 {}
class Test4 {}
class Test5 {}
class Test6 {}
const TEST_VALUE = 'expected value';

const DI = {} as Dictionary;

class TestClass {

  constructor(private readonly orm: MikroORM) {}

  @UseRequestContext()
  async asyncMethodReturnsValue() {
    return TEST_VALUE;
  }

  @UseRequestContext()
  methodReturnsValue() {
    return TEST_VALUE;
  }

  @UseRequestContext()
  async asyncMethodReturnsNothing() {
    //
  }

  @UseRequestContext()
  methodReturnsNothing() {
    //
  }

  @UseRequestContext(() => DI.orm)
  methodWithCallback() {
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
    expect(storage[key].properties.test0).toMatchObject({ reference: ReferenceType.MANY_TO_MANY, name: 'test0' });
    expect(storage[key].properties.test0.entity()).toBe(Test);
    expect(Object.keys(MetadataStorage.getMetadata())).toHaveLength(7);
    Subscriber()(Test6);
    expect(Object.keys(MetadataStorage.getSubscriberMetadata())).toHaveLength(1);
    MetadataStorage.clear();
    expect(Object.keys(MetadataStorage.getMetadata())).toHaveLength(0);
    expect(Object.keys(MetadataStorage.getSubscriberMetadata())).toHaveLength(0);
  });

  test('ManyToOne', () => {
    const storage = MetadataStorage.getMetadata();
    const key = 'Test3-' + Utils.hash('/path/to/entity');
    ManyToOne({ entity: () => Test })(new Test3(), 'test1');
    ManyToOne({ entity: () => Test })(new Test3(), 'test1'); // calling multiple times won't throw
    expect(storage[key].properties.test1).toMatchObject({ reference: ReferenceType.MANY_TO_ONE, name: 'test1' });
    expect(storage[key].properties.test1.entity()).toBe(Test);
  });

  test('OneToOne', () => {
    const storage = MetadataStorage.getMetadata();
    const key = 'Test6-' + Utils.hash('/path/to/entity');
    OneToOne({ entity: () => Test, inversedBy: 'test5' } as any)(new Test6(), 'test1');
    expect(storage[key].properties.test1).toMatchObject({ reference: ReferenceType.ONE_TO_ONE, name: 'test1', inversedBy: 'test5' });
    expect(storage[key].properties.test1.entity()).toBe(Test);
  });

  test('OneToMany', () => {
    const storage = MetadataStorage.getMetadata();
    const key = 'Test4-' + Utils.hash('/path/to/entity');
    OneToMany({ entity: () => Test, mappedBy: 'test' } as any)(new Test4(), 'test2');
    OneToMany({ entity: () => Test, mappedBy: 'test' } as any)(new Test4(), 'test2'); // calling multiple times won't throw
    expect(storage[key].properties.test2).toMatchObject({ reference: ReferenceType.ONE_TO_MANY, name: 'test2', mappedBy: 'test' });
    expect(storage[key].properties.test2.entity()).toBe(Test);
  });

  test('Property', () => {
    const storage = MetadataStorage.getMetadata();
    const key = 'Test5-' + Utils.hash('/path/to/entity');
    Property()(new Test5(), 'test3');
    expect(storage[key].properties.test3).toMatchObject({ reference: ReferenceType.SCALAR, name: 'test3' });
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

  test('UseRequestContext', async () => {
    const orm = Object.create(MikroORM.prototype, { em: { value: { name: 'default', fork: jest.fn() } } });
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

    const err = '@UseRequestContext() decorator can only be applied to methods of classes with `orm: MikroORM` property, or with a callback parameter like `@UseRequestContext(() => orm)`';
    await expect(test2.asyncMethodReturnsValue()).rejects.toThrow(err);
  });

});
