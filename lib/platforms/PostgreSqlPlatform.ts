import { NamingStrategy, UnderscoreNamingStrategy } from '../naming-strategy';
import { Platform } from './Platform';
import { PostgreSqlSchemaHelper } from '../schema/PostgreSqlSchemaHelper';

export class PostgreSqlPlatform extends Platform {

  protected schemaHelper = new PostgreSqlSchemaHelper();

  supportsSavePoints(): boolean {
    return true;
  }

  getNamingStrategy(): { new(): NamingStrategy} {
    return UnderscoreNamingStrategy;
  }

  getParameterPlaceholder(index?: number): string {
    return '$' + index;
  }

  usesReturningStatement(): boolean {
    return true;
  }

  usesCascadeStatement(): boolean {
    return true;
  }

  getReadLockSQL(): string {
    return 'FOR SHARE';
  }

}
