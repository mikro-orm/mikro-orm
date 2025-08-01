import { Type } from './Type';
import type { Platform } from '../platforms';
import type { EntityProperty } from '../typings';

export class BooleanType extends Type<boolean | null | undefined, boolean | null | undefined> {

  override getColumnType(prop: EntityProperty, platform: Platform) {
    return platform.getBooleanTypeDeclarationSQL();
  }

  override compareAsType(): string {
    return 'boolean';
  }

  override ensureComparable(): boolean {
    return false;
  }

}
