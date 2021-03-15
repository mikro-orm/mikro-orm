import { Type } from './Type';
import { Platform } from '../platforms';
import { EntityProperty } from '../typings';

export class TinyIntType extends Type<number | null | undefined, number | null | undefined> {

  getColumnType(prop: EntityProperty, platform: Platform) {
    return platform.getTinyIntTypeDeclarationSQL(prop);
  }

  compareAsType(): string {
    return 'number';
  }

}
