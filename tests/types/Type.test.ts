import { Type } from '../../lib/types';
import { MongoPlatform } from '../../lib/platforms/MongoPlatform';

class TestType extends Type { }

describe('Type', () => {

  const type = new TestType();
  const platform = new MongoPlatform();

  test('convertToDatabaseValue', () => {
    expect(type.convertToDatabaseValue('asd', platform)).toBe('asd');
    expect(type.convertToDatabaseValue(null, platform)).toBe(null);
    expect(type.convertToDatabaseValue(undefined, platform)).toBe(undefined);
  });

  test('convertToJSValue', () => {
    expect(type.convertToJSValue('asd', platform)).toBe('asd');
    expect(type.convertToJSValue(null, platform)).toBe(null);
    expect(type.convertToJSValue(undefined, platform)).toBe(undefined);
  });

  test('getColumnType', () => {
    expect(type.getColumnType({ columnType: 'asd' } as any, platform)).toBe('asd');
  });

});
