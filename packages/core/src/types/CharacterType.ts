import { StringType } from './StringType';
import type { Platform } from '../platforms';
import type { EntityProperty } from '../typings';

export class CharacterType extends StringType {

  override getColumnType(prop: EntityProperty, platform: Platform) {
    return platform.getCharTypeDeclarationSQL(prop);
  }

  override getDefaultLength(platform: Platform): number {
    return platform.getDefaultCharLength();
  }

}
