import { ArrayType } from './ArrayType.js';
import { BigIntType } from './BigIntType.js';
import { BlobType } from './BlobType.js';
import { BooleanType } from './BooleanType.js';
import { DateTimeType } from './DateTimeType.js';
import { DateType } from './DateType.js';
import { DecimalType } from './DecimalType.js';
import { DoubleType } from './DoubleType.js';
import { EnumArrayType } from './EnumArrayType.js';
import { EnumType } from './EnumType.js';
import { CharacterType } from './CharacterType.js';
import { FloatType } from './FloatType.js';
import { IntegerType } from './IntegerType.js';
import { IntervalType } from './IntervalType.js';
import { JsonType } from './JsonType.js';
import { MediumIntType } from './MediumIntType.js';
import { SmallIntType } from './SmallIntType.js';
import { StringType } from './StringType.js';
import { TextType } from './TextType.js';
import { TimeType } from './TimeType.js';
import { TinyIntType } from './TinyIntType.js';
import { type IType, type TransformContext, Type } from './Type.js';
import { Uint8ArrayType } from './Uint8ArrayType.js';
import { UnknownType } from './UnknownType.js';
import { UuidType } from './UuidType.js';

export type { TransformContext, IType };
export {
  Type,
  DateType,
  TimeType,
  DateTimeType,
  BigIntType,
  BlobType,
  Uint8ArrayType,
  ArrayType,
  EnumArrayType,
  EnumType,
  JsonType,
  IntegerType,
  SmallIntType,
  TinyIntType,
  MediumIntType,
  FloatType,
  DoubleType,
  BooleanType,
  DecimalType,
  StringType,
  UuidType,
  TextType,
  UnknownType,
  IntervalType,
  CharacterType,
};

export const types = {
  date: DateType,
  time: TimeType,
  datetime: DateTimeType,
  bigint: BigIntType,
  blob: BlobType,
  uint8array: Uint8ArrayType,
  array: ArrayType,
  enumArray: EnumArrayType,
  enum: EnumType,
  json: JsonType,
  integer: IntegerType,
  smallint: SmallIntType,
  tinyint: TinyIntType,
  mediumint: MediumIntType,
  float: FloatType,
  double: DoubleType,
  boolean: BooleanType,
  decimal: DecimalType,
  character: CharacterType,
  string: StringType,
  uuid: UuidType,
  text: TextType,
  interval: IntervalType,
  unknown: UnknownType,
} as const;

export const t = types;

/**
 * Brand each built-in type constructor with its registry key via a cross-module symbol.
 * Symbol.for() returns the same symbol across CJS/ESM module graphs, so this survives
 * the dual-package hazard (e.g. when using tsx or @swc-node/register with "type": "commonjs").
 * Using Object.defineProperty ensures the brand is an own (non-inherited) property,
 * so subclasses (e.g. MyJsonType extends JsonType) won't be detected as built-in types.
 */
const ORM_TYPE = Symbol.for('@mikro-orm/type');
for (const [key, type] of Object.entries(types)) {
  Object.defineProperty(type, ORM_TYPE, { value: key, enumerable: false });
}

export { ORM_TYPE };
