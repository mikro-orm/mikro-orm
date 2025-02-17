import type { Platform, EntityProperty } from '@mikro-orm/core';

import { UnicodeStringType } from './UnicodeStringType.js';

export class UnicodeCharacterType extends UnicodeStringType {

  override getColumnType(prop: EntityProperty, platform: Platform) {
    const length = prop.length === -1 ? 'max' : (prop.length ?? this.getDefaultLength(platform));
    return `nchar(${length})`;
  }

  override getDefaultLength(platform: Platform): number {
    return platform.getDefaultCharLength();
  }

}
