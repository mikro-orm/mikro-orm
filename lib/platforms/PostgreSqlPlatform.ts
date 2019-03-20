import { NamingStrategy, UnderscoreNamingStrategy } from '../naming-strategy';
import { Platform } from './Platform';

export class PostgreSqlPlatform extends Platform {

  supportsSavePoints(): boolean {
    return true;
  }

  getNamingStrategy(): { new(): NamingStrategy} {
    return UnderscoreNamingStrategy;
  }

  getIdentifierQuoteCharacter(): string {
    return '"';
  }

  getParameterPlaceholder(index?: number): string {
    return '$' + index;
  }

  usesReturningStatement(): boolean {
    return true;
  }

}
