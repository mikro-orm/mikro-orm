import { PropertyOptions } from './Property';
import { EntityProperty, IEntity } from './Entity';
import { MetadataStorage } from '../metadata';
import { Utils } from '../utils';
import { Cascade, ReferenceType } from '../entity';

export function OneToOne(options: OneToOneOptions): Function {
  return function (target: IEntity, propertyName: string) {
    const meta = MetadataStorage.getMetadata(target.constructor.name);
    Utils.lookupPathFromDecorator(meta);
    const property = {
      name: propertyName,
      reference: ReferenceType.ONE_TO_ONE,
      owner: !!options.inversedBy,
      cascade: [Cascade.PERSIST, Cascade.MERGE],
    };
    const prop = Object.assign(property, options) as EntityProperty;
    prop.nullable = !prop.cascade.includes(Cascade.REMOVE) && !prop.cascade.includes(Cascade.ALL);
    prop.unique = prop.owner;
    meta.properties[propertyName] = prop;
  };
}

export interface OneToOneOptions extends PropertyOptions {
  entity?: () => string | Function,
  owner?: boolean;
  inversedBy?: string;
  mappedBy?: string;
  cascade?: Cascade[];
  orphanRemoval?: boolean;
  joinColumn?: string;
  inverseJoinColumn?: string;
  referenceColumnName?: string;
}
