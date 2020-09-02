import { ManyToMany, ManyToOne, OneToMany, OneToOne, Property, MetadataStorage, ReferenceType, Utils } from '@mikro-orm/core';
import { Test } from './entities';

class Test2 {}
class Test3 {}
class Test4 {}
class Test5 {}
class Test6 {}

describe('decorators', () => {

  const lookupPathFromDecorator = jest.spyOn(Utils, 'lookupPathFromDecorator');
  lookupPathFromDecorator.mockReturnValue('/path/to/entity');

  test('ManyToMany', () => {
    const storage = MetadataStorage.getMetadata();
    const key = 'Test2-' + Utils.hash('/path/to/entity');
    ManyToMany({ entity: () => Test })(new Test2(), 'test0');
    ManyToMany({ entity: () => Test })(new Test2(), 'test0'); // calling multiple times won't throw
    expect(storage[key].properties.test0).toMatchObject({ reference: ReferenceType.MANY_TO_MANY, name: 'test0' });
    expect(storage[key].properties.test0.entity()).toBe(Test);
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

});
