import { type IndexOptions, type UniqueOptions, type EntityMetadata, type Constructor } from '@mikro-orm/core';

function createDecorator<T extends object>(options: IndexOptions<T> | UniqueOptions<T>, unique: boolean) {
  return function (
    value: unknown,
    context: ClassDecoratorContext<T & Constructor> | ClassFieldDecoratorContext<T>,
  ): any {
    const meta = context.metadata as Partial<EntityMetadata<T>>;

    if (context.kind === 'field') {
      options.properties ??= context.name as any;
    }

    const key = unique ? 'uniques' : 'indexes';
    meta[key] ??= [];
    meta[key].push(options as any);
  };
}

export function Index<T extends object, H extends string>(options: IndexOptions<T, H> = {}) {
  return createDecorator(options, false);
}

export function Unique<T extends object, H extends string>(options: UniqueOptions<T, H> = {}) {
  return createDecorator(options, true);
}
