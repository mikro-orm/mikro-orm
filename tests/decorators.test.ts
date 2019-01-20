import { getMetadataStorage, ManyToMany, ManyToOne, OneToMany, Property, ReferenceType } from '../lib';
import { Test } from './entities';

class Test2 {}
class Test3 {}
class Test4 {}
class Test5 {}

describe('decorators', () => {

  test('ManyToMany', () => {
    expect(() => ManyToMany({} as any)(new Test(), 'test')).toThrowError(`@ManyToMany({ entity: string | Function })' is required in 'Test.test`);

    const storage = getMetadataStorage();
    ManyToMany({ entity: () => Test })(new Test2(), 'test0');
    expect(storage.Test2.properties.test0).toMatchObject({
      reference: ReferenceType.MANY_TO_MANY,
      owner: false,
      name: 'test0',
    });
    expect(storage.Test2.properties.test0.entity()).toBe(Test);
  });

  test('ManyToOne', () => {
    const storage = getMetadataStorage();
    ManyToOne({ entity: () => Test })(new Test3(), 'test1');
    expect(storage.Test3.properties.test1).toMatchObject({
      reference: ReferenceType.MANY_TO_ONE,
      name: 'test1',
    });
    expect(storage.Test3.properties.test1.entity()).toBe(Test);
  });

  test('OneToMany', () => {
    expect(() => OneToMany({} as any)(new Test(), 'test')).toThrowError(`@OneToMany({ entity: string | Function })' is required in 'Test.test`);

    const storage = getMetadataStorage();
    OneToMany({ entity: () => Test, fk: 'test' })(new Test4(), 'test2');
    expect(storage.Test4.properties.test2).toMatchObject({
      reference: ReferenceType.ONE_TO_MANY,
      name: 'test2',
      fk: 'test',
    });
    expect(storage.Test4.properties.test2.entity()).toBe(Test);
  });

  test('Property', () => {
    const storage = getMetadataStorage();
    Property()(new Test5(), 'test3');
    expect(storage.Test5.properties.test3).toMatchObject({
      reference: ReferenceType.SCALAR,
      name: 'test3',
    });
  });

});
