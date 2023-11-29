import { Type } from './Type';
import type { Platform } from '../platforms';
import type { EntityProperty } from '../typings';

export class TinyIntType extends Type<number | null | undefined, number | null | undefined> {

  override getColumnType(prop: EntityProperty, platform: Platform) {
    return platform.getTinyIntTypeDeclarationSQL(prop);
  }

  override compareAsType(): string {
    return 'number';
  }

  override ensureComparable(): boolean {
    return false;
  }

}
