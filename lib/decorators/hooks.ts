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

export function BeforeDelete() {
  return hook('beforeDelete');
}

export function AfterDelete() {
  return hook('afterDelete');
}

function hook(type: string) {
  return function (target: any, propertyKey: string) {
    if (!target._odm) {
      target._odm = {hooks: {type: []}};
    } else if (!target._odm.hooks) {
      target._odm.hooks = {};
      target._odm.hooks[type] = [];
    } else if (!target._odm.hooks[type]) {
      target._odm.hooks[type] = [];
    }

    target._odm.hooks[type].push(propertyKey);
  };
}
