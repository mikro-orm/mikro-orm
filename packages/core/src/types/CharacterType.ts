import { StringType } from './StringType.js';
import type { Platform } from '../platforms/Platform.js';
import type { EntityProperty } from '../typings.js';

export class CharacterType extends StringType {

  override getColumnType(prop: EntityProperty, platform: Platform) {
    return platform.getCharTypeDeclarationSQL(prop);
  }

  override getDefaultLength(platform: Platform): number {
    return platform.getDefaultCharLength();
  }

}
