import { Type } from '@mikro-orm/core';

export class FullTextType extends Type<string, string> {

  override compareAsType(): string {
    return 'string';
  }

  override getColumnType(): string {
    return 'tsvector';
  }

  override convertToDatabaseValueSQL(key: string) {
    return `to_tsvector('simple', ${key})`;
  }

}
