import { MetadataStorage } from '../metadata';
import { ReferenceType } from '../enums';
import { EntityProperty, AnyEntity } from '../typings';
import { Utils } from '../utils/Utils';

export function Formula(formula: string | ((alias: string) => string)) {
  return function (target: AnyEntity, propertyName: string) {
    const meta = MetadataStorage.getMetadataFromDecorator(target.constructor);
    meta.properties[propertyName] = { name: propertyName, reference: ReferenceType.SCALAR, persist: false, formula } as EntityProperty;

    return Utils.propertyDecoratorReturnValue();
  };
}
