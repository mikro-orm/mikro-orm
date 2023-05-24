import type { ReferenceOptions } from './Property';
import { MetadataStorage, MetadataValidator } from '../metadata';
import { Utils } from '../utils';
import { ReferenceKind } from '../enums';
import type { AnyEntity, AnyString, EntityKey, EntityName, EntityProperty } from '../typings';

export function ManyToOne<T extends object, O>(
  entity: ManyToOneOptions<T, O> | string | ((e?: any) => EntityName<T>) = {},
  options: Partial<ManyToOneOptions<T, O>> = {},
) {
  return function (target: AnyEntity, propertyName: string) {
    options = Utils.processDecoratorParameters<ManyToOneOptions<T, O>>({ entity, options });
    const meta = MetadataStorage.getMetadataFromDecorator(target.constructor as T);
    MetadataValidator.validateSingleDecorator(meta, propertyName, ReferenceKind.MANY_TO_ONE);
    const property = { name: propertyName, kind: ReferenceKind.MANY_TO_ONE } as EntityProperty;
    meta.properties[propertyName as EntityKey<T>] = Object.assign(meta.properties[propertyName as EntityKey<T>] ?? {}, property, options);

    return Utils.propertyDecoratorReturnValue();
  };
}

export interface ManyToOneOptions<Owner, Target> extends ReferenceOptions<Owner, Target> {
  inversedBy?: (string & keyof Target) | ((e: Target) => any);
  ref?: boolean;
  primary?: boolean;
  mapToPk?: boolean;
  joinColumn?: string;
  joinColumns?: string[];
  referenceColumnName?: string;
  referencedColumnNames?: string[];
  deleteRule?: 'cascade' | 'no action' | 'set null' | 'set default' | AnyString;
  updateRule?: 'cascade' | 'no action' | 'set null' | 'set default' | AnyString;
}
