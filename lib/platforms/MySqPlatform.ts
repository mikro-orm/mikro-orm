import { Platform } from './Platform';

export class MySqPlatform extends Platform {

  getIdentifierQuoteCharacter(): string {
    return '`';
  }

}
