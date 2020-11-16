import { inspect } from 'util';
import { ArrayType } from './ArrayType';
import { Platform } from '../platforms';
import { ValidationError } from '../errors';

function mapHydrator<T>(items: T[] | undefined, hydrate: (i: string) => T): (i: string) => T {
  if (items && items.length > 0 && typeof items[0] === 'number') {
    return (i: string) => +i as unknown as T;
  }

  return hydrate;
}

export class EnumArrayType<T extends string | number = string> extends ArrayType<T> {

  constructor(private readonly owner: string,
              private readonly items?: T[],
              hydrate: (i: string) => T = i => i as T) {
    super(mapHydrator(items, hydrate));
  }

  convertToDatabaseValue(value: T[] | null, platform: Platform, fromQuery?: boolean): string | null {
    /* istanbul ignore else */
    if (Array.isArray(value) && Array.isArray(this.items)) {
      const invalid = value.filter(v => !this.items!.includes(v));

      if (invalid.length > 0) {
        throw new ValidationError(`Invalid enum array items provided in ${this.owner}: ${inspect(invalid)}`);
      }
    }

    return super.convertToDatabaseValue(value, platform, fromQuery);
  }

}
