import { MetadataStorage } from '../metadata';
import { HookType } from '../typings';

function hook(type: HookType) {
  return function (target: any, method: string) {
    const meta = MetadataStorage.getMetadataFromDecorator(target.constructor);

    if (!meta.hooks[type]) {
      meta.hooks[type] = [];
    }

    meta.hooks[type]!.push(method);
  };
}

export function BeforeCreate() {
  return hook('beforeCreate');
}

export function AfterCreate() {
  return hook('afterCreate');
}

export function BeforeUpdate() {
  return hook('beforeUpdate');
}

export function AfterUpdate() {
  return hook('afterUpdate');
}

export function OnInit() {
  return hook('onInit');
}

/**
 * Called before deleting entity, but only when providing initialized entity to EM#remove()
 */
export function BeforeDelete() {
  return hook('beforeDelete');
}

/**
 * Called after deleting entity, but only when providing initialized entity to EM#remove()
 */
export function AfterDelete() {
  return hook('afterDelete');
}
