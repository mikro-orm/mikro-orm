import {
  ReferenceKind,
  type ManyToOneOptions,
  type EntityKey,
  type EntityName,
  type EntityProperty,
} from '@mikro-orm/core';
import { processDecoratorParameters, validateSingleDecorator, getMetadataFromDecorator } from '../utils.js';

export function ManyToOne<Target extends object, Owner extends object>(
  entity: (e?: any) => EntityName<Target> | EntityName[],
  options?: Partial<ManyToOneOptions<Owner, Target>>,
): (target: Owner, propertyName: string) => void;
export function ManyToOne<Target extends object, Owner extends object>(entity: string, options?: any): never;
export function ManyToOne<Target extends object, Owner extends object>(
  options?: ManyToOneOptions<Owner, Target>,
): (target: Owner, propertyName: string) => void;
export function ManyToOne<Target extends object, Owner extends object>(
  entity: ManyToOneOptions<Owner, Target> | ((e?: any) => EntityName<Target> | EntityName[]) = {},
  options: Partial<ManyToOneOptions<Owner, Target>> = {},
) {
  return function (target: Owner, propertyName: keyof Owner) {
    options = processDecoratorParameters<ManyToOneOptions<Owner, Target>>({ entity, options });
    const meta = getMetadataFromDecorator(target.constructor as Owner);
    validateSingleDecorator(meta, propertyName as string, ReferenceKind.MANY_TO_ONE);
    const property = { name: propertyName, kind: ReferenceKind.MANY_TO_ONE } as EntityProperty;
    meta.properties[propertyName as EntityKey<Owner>] = Object.assign(
      meta.properties[propertyName as EntityKey<Owner>] ?? {},
      property,
      options,
    );
  };
}
