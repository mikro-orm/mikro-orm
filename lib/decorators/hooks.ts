import { MetadataStorage } from '../MetadataStorage';

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

function hook(type: string) {
  return function (target: any, method: string) {
    const storage = MetadataStorage.getMetadata(target.constructor.name);
    const meta = storage[target.constructor.name];

    if (!meta.hooks) {
      meta.hooks = {};
    }

    if (!meta.hooks[type]) {
      meta.hooks[type] = [];
    }

    meta.hooks[type].push(method);
  };
}
