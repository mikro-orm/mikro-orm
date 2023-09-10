import type { Platform } from '../platforms';
import type { EntityProperty } from '../typings';
import { Type } from './Type';

export class FloatType extends Type<number | null | undefined, number | null | undefined> {
  override getColumnType(prop: EntityProperty, platform: Platform) {
    return platform.getFloatDeclarationSQL();
  }

  override compareAsType(): string {
    return 'number';
  }

  override ensureComparable(): boolean {
    return false;
  }
}
