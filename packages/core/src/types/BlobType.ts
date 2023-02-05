import { Type } from './Type';
import type { Platform } from '../platforms';
import type { EntityProperty } from '../typings';

export class BlobType extends Type<Buffer | null> {

  override convertToDatabaseValue(value: Buffer | null): Buffer | null {
    return value;
  }

  override convertToJSValue(value: Buffer): Buffer | null {
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

  override compareAsType(): string {
    return 'Buffer';
  }

  override getColumnType(prop: EntityProperty, platform: Platform): string {
    return platform.getBlobDeclarationSQL();
  }

}
