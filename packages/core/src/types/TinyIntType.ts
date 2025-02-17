import { Type } from './Type.js';
import type { Platform } from '../platforms/Platform.js';
import type { EntityProperty } from '../typings.js';

export class TinyIntType extends Type<number | null | undefined, number | null | undefined> {

  override getColumnType(prop: EntityProperty, platform: Platform) {
    return platform.getTinyIntTypeDeclarationSQL(prop);
  }

  override compareAsType(): string {
    return 'number';
  }

  /* v8 ignore next 3 */
  override ensureComparable(): boolean {
    return false;
  }

}
