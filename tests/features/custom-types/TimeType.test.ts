import { TimeType } from '@mikro-orm/core';
import { MongoPlatform } from '@mikro-orm/mongodb';

describe('TimeType', () => {
  const type = new TimeType();
  const platform = new MongoPlatform();

  test('convertToDatabaseValue', () => {
    expect(type.convertToDatabaseValue('00:00:01', platform)).toBe('00:00:01');
    expect(type.convertToDatabaseValue(null, platform)).toBe(null);
    expect(type.convertToDatabaseValue(undefined, platform)).toBe(undefined);
    expect(() => type.convertToDatabaseValue(1 as any, platform)).toThrow(
      `Could not convert JS value '1' of type 'number' to type TimeType`,
    );
    expect(() => type.convertToDatabaseValue('2000-01-01', platform)).toThrow(
      `Could not convert JS value '2000-01-01' of type 'string' to type TimeType`,
    );
    expect(() => type.convertToDatabaseValue(new Date('2000-01-01') as any, platform)).toThrow(
      `Could not convert JS value '2000-01-01T00:00:00.000Z' of type 'date' to type TimeType`,
    );
  });

  test.each(['00:00:01.1', '12:34:56.123', '23:59:59.123456', '12:34:56.1234567', '123:45:56.123'])(
    'preserves fractional seconds in %s',
    value => {
      expect(type.convertToDatabaseValue(value, platform)).toBe(value);
    },
  );

  test.each(['12:34.123', '12:34:56.', '12:34:56.123x', '12:60:56.123', '12:34:60.123'])(
    'rejects invalid fractional time %s',
    value => {
      expect(() => type.convertToDatabaseValue(value, platform)).toThrow('Could not convert JS value');
    },
  );

  test('getColumnType', () => {
    expect(type.getColumnType({ columnType: 'asd' } as any, platform)).toBe('time');
  });
});
