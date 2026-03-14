import type { Platform } from '../platforms/Platform.js';
import type { EntityProperty } from '../typings.js';
import { IntegerType } from './IntegerType.js';

/** Maps a database MEDIUMINT column to a JS `number`. */
export class MediumIntType extends IntegerType {
  override getColumnType(prop: EntityProperty, platform: Platform): string {
    return platform.getMediumIntTypeDeclarationSQL(prop);
  }
}
