import { TimeType } from '@mikro-orm/core';
import { MongoPlatform } from '@mikro-orm/mongodb';

describe('TimeType', () => {

  const type = new TimeType();
  const platform = new MongoPlatform();

  test('convertToDatabaseValue', () => {
    expect(type.convertToDatabaseValue('00:00:01', platform)).toBe('00:00:01');
    expect(type.convertToDatabaseValue(null, platform)).toBe(null);
    expect(type.convertToDatabaseValue(undefined, platform)).toBe(undefined);
    expect(() => type.convertToDatabaseValue(1, platform)).toThrowError(`Could not convert JS value '1' of type 'number' to type TimeType`);
    expect(() => type.convertToDatabaseValue('2000-01-01', platform)).toThrowError(`Could not convert JS value '2000-01-01' of type 'string' to type TimeType`);
    expect(() => type.convertToDatabaseValue(new Date('2000-01-01'), platform)).toThrowError(`Could not convert JS value '2000-01-01T00:00:00.000Z' of type 'date' to type TimeType`);
  });

  test('getColumnType', () => {
    expect(type.getColumnType({ columnType: 'asd' } as any, platform)).toBe('time');
  });

});
