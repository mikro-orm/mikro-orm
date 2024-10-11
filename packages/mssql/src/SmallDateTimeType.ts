import { DateTimeType } from '@mikro-orm/core';

export class SmallDateTimeType extends DateTimeType {

  override getColumnType(): string {
    return 'smalldatetime';
  }

  override getDefaultLength(): number {
    return 0;
  }

}
