import { StringType } from './StringType';

export class UnknownType extends StringType {

  compareAsType(): string {
    return 'unknown';
  }

}
