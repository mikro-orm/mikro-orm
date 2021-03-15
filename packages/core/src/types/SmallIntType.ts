import { Type } from './Type';
import { Platform } from '../platforms';
import { EntityProperty } from '../typings';

export class SmallIntType extends Type<number | null | undefined, number | null | undefined> {

  getColumnType(prop: EntityProperty, platform: Platform) {
    return platform.getSmallIntTypeDeclarationSQL(prop);
  }

  compareAsType(): string {
    return 'number';
  }

}
