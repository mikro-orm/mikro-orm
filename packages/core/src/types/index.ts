import { Type } from './Type';
import { DateType } from './DateType';
import { TimeType } from './TimeType';
import { DateTimeType } from './DateTimeType';
import { BigIntType } from './BigIntType';
import { BlobType } from './BlobType';
import { ArrayType } from './ArrayType';
import { EnumArrayType } from './EnumArrayType';
import { EnumType } from './EnumType';
import { JsonType } from './JsonType';
import { IntegerType } from './IntegerType';
import { SmallIntType } from './SmallIntType';
import { TinyIntType } from './TinyIntType';
import { FloatType } from './FloatType';
import { DoubleType } from './DoubleType';
import { BooleanType } from './BooleanType';
import { DecimalType } from './DecimalType';
import { StringType } from './StringType';
import { UuidType } from './UuidType';
import { TextType } from './TextType';
import { UnknownType } from './UnknownType';

export {
  Type, DateType, TimeType, DateTimeType, BigIntType, BlobType, ArrayType, EnumArrayType, EnumType,
  JsonType, IntegerType, SmallIntType, TinyIntType, FloatType, DoubleType, BooleanType, DecimalType,
  StringType, UuidType, TextType, UnknownType,
};

export const t = {
  date: DateType,
  time: TimeType,
  datetime: DateTimeType,
  bigint: BigIntType,
  blob: BlobType,
  array: ArrayType,
  enumArray: EnumArrayType,
  enum: EnumType,
  json: JsonType,
  integer: IntegerType,
  smallint: SmallIntType,
  tinyint: TinyIntType,
  float: FloatType,
  double: DoubleType,
  boolean: BooleanType,
  decimal: DecimalType,
  string: StringType,
  uuid: UuidType,
  text: TextType,
};
