import { IPrimaryKey } from '../typings';

/**
 * @internal
 */
export class EntityIdentifier {

  constructor(private value?: IPrimaryKey) { }

  setValue(value: IPrimaryKey): void {
    this.value = value;
  }

  getValue<T extends IPrimaryKey = IPrimaryKey>(): T {
    return this.value as T;
  }

}
