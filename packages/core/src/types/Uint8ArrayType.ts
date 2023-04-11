import { Type } from './Type';
import type { Platform } from '../platforms';
import type { EntityProperty } from '../typings';

export class Uint8ArrayType extends Type<Uint8Array | null> {

  override convertToDatabaseValue(value: Uint8Array): Buffer {
    if (!value) {
      return value;
    }

    return Buffer.from(value);
  }

  override convertToJSValue(value: Buffer): Uint8Array | null {
    if (!value) {
      return value;
    }

    /* istanbul ignore else */
    if (value as unknown instanceof Buffer) {
      return new Uint8Array(value);
    }

    /* istanbul ignore else */
    if (value.buffer instanceof Buffer) {
      return new Uint8Array(value.buffer);
    }

    /* istanbul ignore next */
    return new Uint8Array(Buffer.from(value));
  }

  override compareAsType(): string {
    return 'Buffer';
  }

  override ensureComparable(): boolean {
    return false;
  }

  override getColumnType(prop: EntityProperty, platform: Platform): string {
    return platform.getBlobDeclarationSQL();
  }

}
