import { Type } from './Type';
import type { Platform } from '../platforms';
import type { EntityProperty } from '../typings';

export class TextType extends Type<string | null | undefined, string | null | undefined> {

  override getColumnType(prop: EntityProperty, platform: Platform) {
    return platform.getTextTypeDeclarationSQL(prop);
  }

  override compareAsType(): string {
    return 'string';
  }

  ensureComparable(): boolean {
    return false;
  }

}
