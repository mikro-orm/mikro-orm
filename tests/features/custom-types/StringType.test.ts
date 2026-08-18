import { inspect } from 'node:util';
import { type StringTypeOptions, StringType, TextType, Utils } from '@mikro-orm/core';
import { MongoPlatform } from '@mikro-orm/mongodb';

describe('StringType', () => {
  const platform = new MongoPlatform();

  test('preserves values and the fast hydration path without options', () => {
    const type = new StringType();

    expect(inspect(type)).toBe('StringType { options: {} }');
    expect(type.convertToDatabaseValue('  Foo Bar  ')).toBe('  Foo Bar  ');
    expect(type.convertToJSValue('  Foo Bar  ', platform)).toBe('  Foo Bar  ');
    expect(type.ensureComparable()).toBe(false);
    expect(type.getDefaultLength(platform)).toBe(platform.getDefaultVarcharLength());
    expect(new StringType({ trim: false }).ensureComparable()).toBe(false);
  });

  test('preserves options when cloned with metadata', () => {
    const type = Utils.copy(new StringType({ trim: true, case: 'upper' }), false);

    expect(type.options).toEqual({ trim: true, case: 'upper' });
    expect(type.convertToDatabaseValue('  Foo Bar  ')).toBe('FOO BAR');
    expect(type.ensureComparable()).toBe(false);
  });

  test.each<[StringTypeOptions, string, string]>([
    [{ trim: true }, '  Foo Bar  ', 'Foo Bar'],
    [{ case: 'upper' }, ' Foo Bar ', ' FOO BAR '],
    [{ case: 'lower' }, ' Foo Bar ', ' foo bar '],
    [{ trim: true, case: 'upper' }, '  Foo Bar  ', 'FOO BAR'],
    [{ trim: true, case: 'lower' }, '  Foo Bar  ', 'foo bar'],
  ])('normalizes database values with %o', (options, value, expected) => {
    const type = new StringType(options);

    expect(type.convertToDatabaseValue(value)).toBe(expected);
    expect(type.convertToJSValue(value, platform)).toBe(value);
    expect(type.ensureComparable()).toBe(false);
  });

  test('compares values by their normalized database representation', () => {
    const type = new StringType({ trim: true, case: 'lower' });

    expect(type.compareValues('  Foo Bar  ', 'foo bar')).toBe(true);
    expect(type.compareValues('  Foo Bar  ', 'other')).toBe(false);
  });

  test('applies trim before casing', () => {
    const upper = vi.fn(() => 'VALUE');
    const trim = vi.fn(() => ({ toUpperCase: upper }));
    const value = { trim } as unknown as string;

    expect(new StringType({ trim: true, case: 'upper' }).convertToDatabaseValue(value)).toBe('VALUE');
    expect(trim.mock.invocationCallOrder[0]).toBeLessThan(upper.mock.invocationCallOrder[0]);
  });

  test.each([null, undefined])('preserves %s', value => {
    const type = new StringType({ trim: true, case: 'upper' });

    expect(type.convertToDatabaseValue(value)).toBe(value);
    expect(type.convertToJSValue(value, platform)).toBe(value);
  });

  test('supports the same normalization options on TextType', () => {
    const type = new TextType({ trim: true, case: 'lower' });

    expect(type.convertToDatabaseValue('  Foo Bar  ')).toBe('foo bar');
    expect(type.convertToJSValue('  Foo Bar  ', platform)).toBe('  Foo Bar  ');
    expect(type.compareValues('  Foo Bar  ', 'foo bar')).toBe(true);
    expect(type.getDefaultLength).toBeUndefined();
  });
});
