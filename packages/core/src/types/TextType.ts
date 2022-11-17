import { Type } from './Type';
import type { Platform } from '../platforms';
import type { EntityProperty } from '../typings';

export class TextType extends Type<string | null | undefined, string | null | undefined> {

  getColumnType(prop: EntityProperty, platform: Platform) {
    return platform.getTextTypeDeclarationSQL(prop);
  }

  compareAsType(): string {
    return 'string';
  }

}
