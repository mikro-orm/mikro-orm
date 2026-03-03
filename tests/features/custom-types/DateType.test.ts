import { DateType } from '@mikro-orm/core';
import { MongoPlatform } from '@mikro-orm/mongodb';

describe('DateType', () => {
  const type = new DateType();
  const platform = new MongoPlatform();

  test('convertToDatabaseValue', () => {
    expect(type.convertToDatabaseValue('2000-01-01', platform)).toBe('2000-01-01');
    expect(type.convertToDatabaseValue(null, platform)).toBe(null);
    expect(type.convertToDatabaseValue(undefined, platform)).toBe(undefined);
  });

  test('convertToJSValue', () => {
    const date = '2000-01-01';
    expect(type.convertToJSValue(date, platform)).toEqual(date);
    expect(type.convertToJSValue(null, platform)).toBe(null);
    expect(type.convertToJSValue(undefined, platform)).toBe(undefined);
  });

  test('getColumnType', () => {
    expect(type.getColumnType({ columnType: 'asd' } as any, platform)).toBe('date');
  });
});
