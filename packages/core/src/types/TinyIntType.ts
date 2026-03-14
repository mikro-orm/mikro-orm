import { Type } from './Type.js';
import type { Platform } from '../platforms/Platform.js';
import type { EntityProperty } from '../typings.js';

/** Maps a database TINYINT column to a JS `number`. */
export class TinyIntType extends Type<number | null | undefined, number | null | undefined> {
  override getColumnType(prop: EntityProperty, platform: Platform): string {
    return platform.getTinyIntTypeDeclarationSQL(prop);
  }

  override compareAsType(): string {
    return 'number';
  }

  /* v8 ignore next */
  override ensureComparable(): boolean {
    return false;
  }
}
