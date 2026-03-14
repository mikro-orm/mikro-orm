import { StringType } from './StringType.js';
import type { Platform } from '../platforms/Platform.js';
import type { EntityProperty } from '../typings.js';

/** Maps a database CHAR (fixed-length) column to a JS `string`. */
export class CharacterType extends StringType {
  override getColumnType(prop: EntityProperty, platform: Platform): string {
    return platform.getCharTypeDeclarationSQL(prop);
  }

  override getDefaultLength(platform: Platform): number {
    return platform.getDefaultCharLength();
  }
}
