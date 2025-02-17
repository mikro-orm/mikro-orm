import { Type } from './Type.js';
import type { Platform } from '../platforms/Platform.js';
import type { EntityProperty } from '../typings.js';

export class Uint8ArrayType extends Type<Uint8Array | null> {

  override convertToDatabaseValue(value: Uint8Array): Buffer {
    if (!value) {
      return value;
    }

    return Buffer.from(value);
  }

  override convertToJSValue(value: Buffer): Uint8Array | null {
    /* v8 ignore next 3 */
    if (!value) {
      return value;
    }

    if (value as unknown instanceof Buffer) {
      return new Uint8Array(value);
    }

    if (value.buffer instanceof Buffer) {
      return new Uint8Array(value.buffer);
    }

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
