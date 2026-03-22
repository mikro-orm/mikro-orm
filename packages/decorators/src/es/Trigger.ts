import { type TriggerDef, type EntityMetadata, type Constructor } from '@mikro-orm/core';

/** Defines a database trigger on an entity class (TC39 decorator). */
export function Trigger<T>(
  options: TriggerDef<T>,
): (value: unknown, context: ClassDecoratorContext<T & Constructor>) => void {
  return function (value: unknown, context: ClassDecoratorContext<T & Constructor>): void {
    const meta = context.metadata as Partial<EntityMetadata<T>>;
    meta.triggers ??= [];
    meta.triggers.push(options);
  };
}
