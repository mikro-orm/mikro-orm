import type { ReferenceOptions } from './Property';
import { MetadataStorage, MetadataValidator } from '../metadata';
import { Utils } from '../utils';
import { ReferenceKind } from '../enums';
import type { AnyEntity, AnyString, EntityName, EntityProperty } from '../typings';

export function ManyToOne<T, O>(
  entity: ManyToOneOptions<T, O> | string | ((e?: any) => EntityName<T>) = {},
  options: Partial<ManyToOneOptions<T, O>> = {},
) {
  return function (target: AnyEntity, propertyName: string) {
    options = Utils.processDecoratorParameters<ManyToOneOptions<T, O>>({ entity, options });
    const meta = MetadataStorage.getMetadataFromDecorator(target.constructor);
    MetadataValidator.validateSingleDecorator(meta, propertyName, ReferenceKind.MANY_TO_ONE);
    const property = { name: propertyName, kind: ReferenceKind.MANY_TO_ONE } as EntityProperty;
    meta.properties[propertyName] = Object.assign(meta.properties[propertyName] ?? {}, property, options);

    return Utils.propertyDecoratorReturnValue();
  };
}

export interface ManyToOneOptions<T, O> extends ReferenceOptions<T, O> {
  inversedBy?: (string & keyof T) | ((e: T) => any);
  ref?: boolean;
  primary?: boolean;
  mapToPk?: boolean;
  joinColumn?: string;
  joinColumns?: string[];
  referenceColumnName?: string;
  referencedColumnNames?: string[];
  onDelete?: 'cascade' | 'no action' | 'set null' | 'set default' | AnyString;
  onUpdateIntegrity?: 'cascade' | 'no action' | 'set null' | 'set default' | AnyString;
}
