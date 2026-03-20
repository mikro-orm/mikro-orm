import { DecimalType, IntegerType, StringType, BooleanType } from '@mikro-orm/core';
import { NativeArrayType } from '@mikro-orm/postgresql';
import { PostgreSqlPlatform } from '@mikro-orm/postgresql';

const platform = new PostgreSqlPlatform();
const prop = (overrides: Record<string, unknown> = {}) =>
  ({ columnTypes: [], autoincrement: false, ...overrides }) as any;

describe('NativeArrayType', () => {
  describe('getColumnType', () => {
    test('integer[] from IntegerType instance', () => {
      const type = new NativeArrayType(new IntegerType());
      expect(type.getColumnType(prop(), platform)).toBe('int[]');
    });

    test('integer[] from IntegerType constructor', () => {
      const type = new NativeArrayType(IntegerType);
      expect(type.getColumnType(prop(), platform)).toBe('int[]');
    });

    test('decimal(10,2)[] forwards precision and scale to inner type', () => {
      const type = new NativeArrayType(new DecimalType());
      expect(type.getColumnType(prop({ precision: 10, scale: 2 }), platform)).toBe('numeric(10,2)[]');
    });

    test('varchar(100)[] forwards length to inner type', () => {
      const type = new NativeArrayType(new StringType());
      expect(type.getColumnType(prop({ length: 100 }), platform)).toBe('varchar(100)[]');
    });

    test('strips autoincrement so inner type does not produce serial', () => {
      const type = new NativeArrayType(new IntegerType());
      expect(type.getColumnType(prop({ autoincrement: true }), platform)).toBe('int[]');
    });
  });

  describe('convertToDatabaseValue', () => {
    test('passes each item through the inner type', () => {
      const inner = new DecimalType('number');
      const type = new NativeArrayType(inner);
      expect(type.convertToDatabaseValue([1.5, 2.5], platform)).toStrictEqual([1.5, 2.5]);
    });

    test('returns null as-is', () => {
      const type = new NativeArrayType(new IntegerType());
      expect(type.convertToDatabaseValue(null, platform)).toBeNull();
    });

    test('returns undefined as-is', () => {
      const type = new NativeArrayType(new IntegerType());
      expect(type.convertToDatabaseValue(undefined as any, platform)).toBeUndefined();
    });

    test('integer values pass through', () => {
      const type = new NativeArrayType(new IntegerType());
      expect(type.convertToDatabaseValue([1, 2, 3], platform)).toStrictEqual([1, 2, 3]);
    });

    test('boolean values pass through', () => {
      const type = new NativeArrayType(new BooleanType());
      expect(type.convertToDatabaseValue([true, false], platform)).toStrictEqual([true, false]);
    });
  });

  describe('convertToJSValue', () => {
    test('returns null as-is', () => {
      const type = new NativeArrayType(new IntegerType());
      expect(type.convertToJSValue(null, platform)).toBeNull();
    });

    test('returns undefined as-is', () => {
      const type = new NativeArrayType(new IntegerType());
      expect(type.convertToJSValue(undefined as any, platform)).toBeUndefined();
    });

    test('integer values pass through', () => {
      const type = new NativeArrayType(new IntegerType());
      expect(type.convertToJSValue([1, 2, 3], platform)).toStrictEqual([1, 2, 3]);
    });

    test('DecimalType convertToJSValue maps string elements to numbers in number mode', () => {
      const inner = new DecimalType('number');
      const type = new NativeArrayType(inner);
      expect(type.convertToJSValue(['1.50', '2.75'] as any, platform)).toStrictEqual([1.5, 2.75]);
    });
  });

  describe('compareAsType', () => {
    test('returns "array"', () => {
      expect(new NativeArrayType(new IntegerType()).compareAsType()).toBe('array');
    });
  });

  describe('toJSON', () => {
    test('returns null as-is', () => {
      const type = new NativeArrayType(new IntegerType());
      expect(type.toJSON(null, platform)).toBeNull();
    });

    test('returns array as-is for simple types', () => {
      const type = new NativeArrayType(new IntegerType());
      expect(type.toJSON([1, 2, 3], platform)).toStrictEqual([1, 2, 3]);
    });
  });

  describe('roundtrip', () => {
    test('integer array roundtrip', () => {
      const type = new NativeArrayType(new IntegerType());
      const original = [1, 2, 3];
      const db = type.convertToDatabaseValue(original, platform);
      expect(type.convertToJSValue(db, platform)).toStrictEqual(original);
    });

    test('nullable array roundtrip', () => {
      const type = new NativeArrayType(new IntegerType());
      expect(type.convertToJSValue(type.convertToDatabaseValue(null, platform), platform)).toBeNull();
    });
  });
});
