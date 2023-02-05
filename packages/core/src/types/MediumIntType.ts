import type { Platform } from '../platforms';
import type { EntityProperty } from '../typings';
import { IntegerType } from './IntegerType';

export class MediumIntType extends IntegerType {

  override getColumnType(prop: EntityProperty, platform: Platform) {
    return platform.getMediumIntTypeDeclarationSQL(prop);
  }

}
