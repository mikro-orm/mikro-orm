import { IPrimaryKey } from '..';

export class EntityIdentifier {

  constructor(private value?: IPrimaryKey) { }

  setValue(value: IPrimaryKey): void {
    this.value = value;
  }

  getValue<T = IPrimaryKey>(): T {
    return this.value as T;
  }

}
