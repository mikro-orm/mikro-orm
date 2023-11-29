import { Type } from './Type';
import type { Platform } from '../platforms';
import type { EntityProperty } from '../typings';

export class StringType extends Type<string | null | undefined, string | null | undefined> {

  override getColumnType(prop: EntityProperty, platform: Platform) {
    return platform.getVarcharTypeDeclarationSQL(prop);
  }

  override compareAsType(): string {
    return 'string';
  }

  override ensureComparable(): boolean {
    return false;
  }

}
