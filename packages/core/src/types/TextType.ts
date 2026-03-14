import { Type } from './Type.js';
import type { Platform } from '../platforms/Platform.js';
import type { EntityProperty } from '../typings.js';

/** Maps a database TEXT column (unbounded length) to a JS `string`. */
export class TextType extends Type<string | null | undefined, string | null | undefined> {
  override getColumnType(prop: EntityProperty, platform: Platform): string {
    return platform.getTextTypeDeclarationSQL(prop);
  }

  override compareAsType(): string {
    return 'string';
  }

  override ensureComparable(): boolean {
    return false;
  }
}
