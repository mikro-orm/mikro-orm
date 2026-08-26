import { BaseStringType } from './StringType.js';
import type { Platform } from '../platforms/Platform.js';
import type { EntityProperty } from '../typings.js';

/** Maps a database TEXT column (unbounded length) to a JS `string`. */
export class TextType extends BaseStringType {
  override getColumnType(prop: EntityProperty, platform: Platform): string {
    return platform.getTextTypeDeclarationSQL(prop);
  }
}
