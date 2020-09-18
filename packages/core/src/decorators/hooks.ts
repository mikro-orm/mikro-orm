import { MetadataStorage } from '../metadata';
import { EventType } from '../enums';

function hook(type: EventType) {
  return function (target: any, method: string) {
    const meta = MetadataStorage.getMetadataFromDecorator(target.constructor);

    if (!meta.hooks[type]) {
      meta.hooks[type] = [];
    }

    meta.hooks[type]!.push(method);

    return target;
  };
}

export function BeforeCreate() {
  return hook(EventType.beforeCreate);
}

export function AfterCreate() {
  return hook(EventType.afterCreate);
}

export function BeforeUpdate() {
  return hook(EventType.beforeUpdate);
}

export function AfterUpdate() {
  return hook(EventType.afterUpdate);
}

export function OnInit() {
  return hook(EventType.onInit);
}

/**
 * Called before deleting entity, but only when providing initialized entity to EM#remove()
 */
export function BeforeDelete() {
  return hook(EventType.beforeDelete);
}

/**
 * Called after deleting entity, but only when providing initialized entity to EM#remove()
 */
export function AfterDelete() {
  return hook(EventType.afterDelete);
}
