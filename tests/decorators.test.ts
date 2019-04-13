import { ManyToMany, ManyToOne, OneToMany, OneToOne, Property } from '../lib';
import { Test } from './entities';
import { MetadataStorage } from '../lib/metadata';
import { ReferenceType } from '../lib/entity';

class Test2 {}
class Test3 {}
class Test4 {}
class Test5 {}
class Test6 {}

describe('decorators', () => {

  test('ManyToMany', () => {
    expect(() => ManyToMany({} as any)(new Test(), 'test')).toThrowError(`@ManyToMany({ entity: string | Function })' is required in 'Test.test`);

    const storage = MetadataStorage.getMetadata();
    ManyToMany({ entity: () => Test })(new Test2(), 'test0');
    expect(storage.Test2.properties.test0).toMatchObject({
      reference: ReferenceType.MANY_TO_MANY,
      owner: false,
      name: 'test0',
    });
    expect(storage.Test2.properties.test0.entity()).toBe(Test);
  });

  test('ManyToOne', () => {
    const storage = MetadataStorage.getMetadata();
    ManyToOne({ entity: () => Test })(new Test3(), 'test1');
    expect(storage.Test3.properties.test1).toMatchObject({
      reference: ReferenceType.MANY_TO_ONE,
      name: 'test1',
    });
    expect(storage.Test3.properties.test1.entity()).toBe(Test);
  });

  test('OneToOne', () => {
    const storage = MetadataStorage.getMetadata();
    OneToOne({ entity: () => Test, inversedBy: 'test5' })(new Test6(), 'test1');
    expect(storage.Test6.properties.test1).toMatchObject({
      reference: ReferenceType.ONE_TO_ONE,
      name: 'test1',
      owner: true,
    });
    expect(storage.Test6.properties.test1.entity()).toBe(Test);
  });

  test('OneToMany', () => {
    expect(() => OneToMany({} as any)(new Test(), 'test')).toThrowError(`@OneToMany({ entity: string | Function })' is required in 'Test.test`);

    const storage = MetadataStorage.getMetadata();
    OneToMany({ entity: () => Test, mappedBy: 'test' })(new Test4(), 'test2');
    expect(storage.Test4.properties.test2).toMatchObject({
      reference: ReferenceType.ONE_TO_MANY,
      name: 'test2',
      mappedBy: 'test',
    });
    expect(storage.Test4.properties.test2.entity()).toBe(Test);
  });

  test('Property', () => {
    const storage = MetadataStorage.getMetadata();
    Property()(new Test5(), 'test3');
    expect(storage.Test5.properties.test3).toMatchObject({
      reference: ReferenceType.SCALAR,
      name: 'test3',
    });
  });

});
