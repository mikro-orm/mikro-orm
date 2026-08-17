import { inspect } from 'node:util';
import { type StringTypeOptions, StringType } from '@mikro-orm/core';
import { MongoPlatform } from '@mikro-orm/mongodb';

describe('StringType', () => {
  const platform = new MongoPlatform();

  test('preserves values and the fast comparison path without options', () => {
    const type = new StringType();

    expect(inspect(type)).toBe('StringType {}');
    expect(type.convertToDatabaseValue('  Foo Bar  ', platform)).toBe('  Foo Bar  ');
    expect(type.convertToJSValue('  Foo Bar  ', platform)).toBe('  Foo Bar  ');
    expect(type.ensureComparable()).toBe(false);
    expect(new StringType({ trim: false }).ensureComparable()).toBe(false);
  });

  test.each<[StringTypeOptions, string, string]>([
    [{ trim: true }, '  Foo Bar  ', 'Foo Bar'],
    [{ case: 'upper' }, ' Foo Bar ', ' FOO BAR '],
    [{ case: 'lower' }, ' Foo Bar ', ' foo bar '],
    [{ trim: true, case: 'upper' }, '  Foo Bar  ', 'FOO BAR'],
    [{ trim: true, case: 'lower' }, '  Foo Bar  ', 'foo bar'],
  ])('normalizes database and JS values with %o', (options, value, expected) => {
    const type = new StringType(options);

    expect(type.convertToDatabaseValue(value, platform)).toBe(expected);
    expect(type.convertToJSValue(value, platform)).toBe(expected);
    expect(type.ensureComparable()).toBe(true);
  });

  test('applies trim before casing', () => {
    const upper = vi.fn(() => 'VALUE');
    const trim = vi.fn(() => ({ toUpperCase: upper }));
    const value = { trim } as unknown as string;

    expect(new StringType({ trim: true, case: 'upper' }).convertToDatabaseValue(value, platform)).toBe('VALUE');
    expect(trim.mock.invocationCallOrder[0]).toBeLessThan(upper.mock.invocationCallOrder[0]);
  });

  test.each([null, undefined])('preserves %s', value => {
    const type = new StringType({ trim: true, case: 'upper' });

    expect(type.convertToDatabaseValue(value, platform)).toBe(value);
    expect(type.convertToJSValue(value, platform)).toBe(value);
  });
});
