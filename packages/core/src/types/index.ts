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
import { FloatType } from './FloatType';
import { IntegerType } from './IntegerType';
import { JsonType } from './JsonType';
import { MediumIntType } from './MediumIntType';
import { SmallIntType } from './SmallIntType';
import { StringType } from './StringType';
import { TextType } from './TextType';
import { TimeType } from './TimeType';
import { TinyIntType } from './TinyIntType';
import { TransformContext, Type } from './Type';
import { Uint8ArrayType } from './Uint8ArrayType';
import { UnknownType } from './UnknownType';
import { UuidType } from './UuidType';

export {
  ArrayType,
  BigIntType,
  BlobType,
  BooleanType,
  DateTimeType,
  DateType,
  DecimalType,
  DoubleType,
  EnumArrayType,
  EnumType,
  FloatType,
  IntegerType,
  JsonType,
  MediumIntType,
  SmallIntType,
  StringType,
  TextType,
  TimeType,
  TinyIntType,
  TransformContext,
  Type,
  Uint8ArrayType,
  UnknownType,
  UuidType,
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
