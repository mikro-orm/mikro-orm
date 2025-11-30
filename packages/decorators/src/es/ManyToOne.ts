import { type EntityMetadata,
  ReferenceKind,
  type ManyToOneOptions,
  type EntityKey,
  type EntityName,
  type EntityProperty,
  Utils,
  type Ref,
} from '@mikro-orm/core';
import { processDecoratorParameters, validateSingleDecorator } from '../utils.js';

export function ManyToOne<Target extends object, Owner extends object>(
  entity: ManyToOneOptions<Owner, Target> | string | ((e?: Owner) => EntityName<Target>) = {},
  options: Partial<ManyToOneOptions<Owner, Target>> = {},
) {
  return function (_: unknown, context: ClassFieldDecoratorContext<Owner, Target | undefined | null | Ref<Target>>) {
    const meta = context.metadata as Partial<EntityMetadata<Owner>>;
    meta.properties ??= {} as Record<EntityKey<Owner>, EntityProperty<Owner>>;
    validateSingleDecorator(meta as any, context.name as string, ReferenceKind.MANY_TO_ONE);
    options = processDecoratorParameters<ManyToOneOptions<Owner, Target>>({ entity, options });
    const property = { name: context.name, kind: ReferenceKind.MANY_TO_ONE } as EntityProperty<Target>;
    meta.properties[context.name as EntityKey<Owner>] = Utils.mergeConfig(meta.properties[context.name as EntityKey<Owner>] ?? {}, property, options);
  };
}
