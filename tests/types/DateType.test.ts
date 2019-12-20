import { DateType } from '../../lib/types';
import { MongoPlatform } from '../../lib/platforms/MongoPlatform';

describe('DateType', () => {

  const type = new DateType();
  const platform = new MongoPlatform();

  test('convertToDatabaseValue', () => {
    expect(type.convertToDatabaseValue('2000-01-01', platform)).toBe('2000-01-01');
    expect(type.convertToDatabaseValue(new Date('2000-01-01'), platform)).toBe('2000-01-01');
    expect(type.convertToDatabaseValue(null, platform)).toBe(null);
    expect(type.convertToDatabaseValue(undefined, platform)).toBe(undefined);
    expect(() => type.convertToDatabaseValue(1, platform)).toThrowError(`Could not convert JS value '1' of type 'number' to type DateType`);
  });

  test('convertToJSValue', () => {
    const date = new Date('2000-01-01Z');
    expect(type.convertToJSValue('2000-01-01', platform)).toEqual(date);
    expect(type.convertToJSValue(new Date('2000-01-01'), platform)).toEqual(date);
    expect(type.convertToJSValue(null, platform)).toBe(null);
    expect(type.convertToJSValue(undefined, platform)).toBe(undefined);
    expect(() => type.convertToJSValue('asd', platform)).toThrowError(`Could not convert database value 'asd' of type 'string' to type DateType`);
  });

  test('getColumnType', () => {
    expect(type.getColumnType({ columnType: 'asd' } as any, platform)).toBe('date');
  });

});
