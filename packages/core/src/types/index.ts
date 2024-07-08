import { ArrayType } from './ArrayType';
import { BigIntType } from './BigIntType';
import { BlobType } from './BlobType';
import { BooleanType } from './BooleanType';
import { DateTimeType } from './DateTimeType';
import { DateType } from './DateType';
import { DecimalType } from './DecimalType';
import { DoubleType } from './DoubleType';
import { EnumArrayType } from './EnumArrayType';
import { EnumType } from './EnumType';
import { CharacterType } from './CharacterType';
import { FloatType } from './FloatType';
import { IntegerType } from './IntegerType';
import { IntervalType } from './IntervalType';
import { JsonType } from './JsonType';
import { MediumIntType } from './MediumIntType';
import { SmallIntType } from './SmallIntType';
import { StringType } from './StringType';
import { TextType } from './TextType';
import { TimeType } from './TimeType';
import { TinyIntType } from './TinyIntType';
import { IType, TransformContext, Type } from './Type';
import { Uint8ArrayType } from './Uint8ArrayType';
import { UnknownType } from './UnknownType';
import { UuidType } from './UuidType';

export {
  Type, DateType, TimeType, DateTimeType, BigIntType, BlobType, Uint8ArrayType, ArrayType, EnumArrayType, EnumType,
  JsonType, IntegerType, SmallIntType, TinyIntType, MediumIntType, FloatType, DoubleType, BooleanType, DecimalType,
  StringType, UuidType, TextType, UnknownType, TransformContext, IntervalType, IType, CharacterType,
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
