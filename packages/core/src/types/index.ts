import { Type, TransformContext } from './Type';
import { DateType } from './DateType';
import { TimeType } from './TimeType';
import { DateTimeType } from './DateTimeType';
import { BigIntType } from './BigIntType';
import { BlobType } from './BlobType';
import { Uint8ArrayType } from './Uint8ArrayType';
import { ArrayType } from './ArrayType';
import { EnumArrayType } from './EnumArrayType';
import { EnumType } from './EnumType';
import { JsonType } from './JsonType';
import { IntegerType } from './IntegerType';
import { SmallIntType } from './SmallIntType';
import { TinyIntType } from './TinyIntType';
import { MediumIntType } from './MediumIntType';
import { FloatType } from './FloatType';
import { DoubleType } from './DoubleType';
import { BooleanType } from './BooleanType';
import { DecimalType } from './DecimalType';
import { StringType } from './StringType';
import { UuidType } from './UuidType';
import { TextType } from './TextType';
import { UnknownType } from './UnknownType';

export {
  Type, DateType, TimeType, DateTimeType, BigIntType, BlobType, Uint8ArrayType, ArrayType, EnumArrayType, EnumType,
  JsonType, IntegerType, SmallIntType, TinyIntType, MediumIntType, FloatType, DoubleType, BooleanType, DecimalType,
  StringType, UuidType, TextType, UnknownType, TransformContext,
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
  string: StringType,
  uuid: UuidType,
  text: TextType,
  unknown: UnknownType,
};

export const t = types;
