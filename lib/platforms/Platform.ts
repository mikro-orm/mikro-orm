import { NamingStrategy, UnderscoreNamingStrategy } from '../naming-strategy';

export abstract class Platform {

  usesPivotTable(): boolean {
    return true;
  }

  supportsTransactions(): boolean {
    return true;
  }

  supportsSavePoints(): boolean {
    return false;
  }

  getNamingStrategy(): { new(): NamingStrategy} {
    return UnderscoreNamingStrategy;
  }

  getIdentifierQuoteCharacter(): string {
    return '"';
  }

}
