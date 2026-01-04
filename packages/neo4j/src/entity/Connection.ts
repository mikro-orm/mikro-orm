import { Collection } from '@mikro-orm/core';

export class Connection<
  T extends object,
  P extends object = object,
  O extends object = object
> implements Iterable<T> {

  private readonly _edges: Collection<T, O>;
  constructor(owner: O) {
    this._edges = new Collection<T, O>(owner);
  }

  get edges(): Collection<T, O> {
    return this._edges;
  }
}

export