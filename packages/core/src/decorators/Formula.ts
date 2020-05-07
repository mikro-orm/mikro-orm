import { MetadataStorage } from '../metadata';
import { ReferenceType } from '../entity';
import { EntityProperty, AnyEntity } from '../typings';

export function Formula(formula: string | ((alias: string) => string)): Function {
  return function (target: AnyEntity, propertyName: string) {
    const meta = MetadataStorage.getMetadataFromDecorator(target.constructor);
    meta.properties[propertyName] = { name: propertyName, reference: ReferenceType.SCALAR, persist: false, formula } as EntityProperty;
  };
}
