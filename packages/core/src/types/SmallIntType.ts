import type { Platform } from '../platforms';
import type { EntityProperty } from '../typings';
import { Type } from './Type';

export class SmallIntType extends Type<number | null | undefined, number | null | undefined> {
  override getColumnType(prop: EntityProperty, platform: Platform) {
    return platform.getSmallIntTypeDeclarationSQL(prop);
  }

  override compareAsType(): string {
    return 'number';
  }

  override ensureComparable(): boolean {
    return false;
  }
}
