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


export class TypeMapper {

  extractSimpleType(type: string): string {
    return type.toLowerCase().match(/[^(), ]+/)![0];
  }

  getDefaultMappedType(type: string): Type<unknown> {
    if (type.endsWith('[]')) {
      return Type.getType(ArrayType);
    }

    switch (this.extractSimpleType(type)) {
      case 'character':
      case 'char': return Type.getType(CharacterType);
      case 'string':
      case 'varchar': return Type.getType(StringType);
      case 'interval': return Type.getType(IntervalType);
      case 'text': return Type.getType(TextType);
      case 'int':
      case 'number': return Type.getType(IntegerType);
      case 'bigint': return Type.getType(BigIntType);
      case 'smallint': return Type.getType(SmallIntType);
      case 'tinyint': return Type.getType(TinyIntType);
      case 'mediumint': return Type.getType(MediumIntType);
      case 'float': return Type.getType(FloatType);
      case 'double': return Type.getType(DoubleType);
      case 'integer': return Type.getType(IntegerType);
      case 'decimal':
      case 'numeric': return Type.getType(DecimalType);
      case 'boolean': return Type.getType(BooleanType);
      case 'blob':
      case 'buffer': return Type.getType(BlobType);
      case 'uint8array': return Type.getType(Uint8ArrayType);
      case 'uuid': return Type.getType(UuidType);
      case 'date': return Type.getType(DateType);
      case 'datetime':
      case 'timestamp': return Type.getType(DateTimeType);
      case 'time': return Type.getType(TimeType);
      case 'object':
      case 'json': return Type.getType(JsonType);
      case 'enum': return Type.getType(EnumType);
      default: return Type.getType(UnknownType);
    }
  }

}
