import { Type } from './Type';
import type { Platform } from '../platforms';
import type { EntityProperty } from '../typings';

export class BlobType extends Type<Buffer | null> {

  convertToDatabaseValue(value: Buffer, platform: Platform): Buffer {
    return value;
  }

  convertToJSValue(value: Buffer, platform: Platform): Buffer | null {
    if (value as unknown instanceof Buffer || !value) {
      return value;
    }

    /* istanbul ignore else */
    if (value.buffer instanceof Buffer) {
      return value.buffer;
    }

    /* istanbul ignore next */
    return Buffer.from(value);
  }

  compareAsType(): string {
    return 'Buffer';
  }

  getColumnType(prop: EntityProperty, platform: Platform): string {
    return platform.getBlobDeclarationSQL();
  }

}
