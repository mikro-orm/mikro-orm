import { Uint8ArrayType } from './Uint8ArrayType.js';
import type { Platform } from '../platforms/Platform.js';
import type { EntityProperty } from '../typings.js';

export class BlobType extends Uint8ArrayType {

  override convertToJSValue(value: Buffer): Buffer | null {
    if (value as unknown instanceof Buffer || !value) {
      return value;
    }

    if (value.buffer instanceof Buffer) {
      return value.buffer;
    }

    return Buffer.from(value);
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
