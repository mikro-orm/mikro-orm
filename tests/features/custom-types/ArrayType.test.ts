import { ArrayType } from '@mikro-orm/core';
import { MongoPlatform } from '@mikro-orm/mongodb';

describe('ArrayType', () => {

  const type = new ArrayType();
  const platform = new MongoPlatform();

  test('convertToDatabaseValue', () => {
    expect(type.convertToDatabaseValue(['a'], platform)).toStrictEqual(['a'] as any);
    expect(type.convertToDatabaseValue(null, platform)).toStrictEqual(null);
    expect(type.convertToDatabaseValue(undefined as any, platform)).toBe(undefined);
    expect(() => type.convertToDatabaseValue(1 as any, platform)).toThrowError(`Could not convert JS value '1' of type 'number' to type ArrayType`);
    // expect(() => type.convertToDatabaseValue('2000-01-01', platform)).toThrowError(`Could not convert JS value '2000-01-01' of type 'string' to type ArrayType`);
    // expect(() => type.convertToDatabaseValue(new Date('2000-01-01'), platform)).toThrowError(`Could not convert JS value '2000-01-01T00:00:00.000Z' of type 'date' to type ArrayType`);
  });

});
