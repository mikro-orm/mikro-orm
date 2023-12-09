import { ValueObject } from './value-object';

const REGEX = /^[a-z0-9.]+@[a-z0-9]+\.[a-z]+(\.[a-z]+)?$/i;

export class Email extends ValueObject<string, Email> {

  protected validate(value: string): boolean {
    return REGEX.test(value);
  }

}
