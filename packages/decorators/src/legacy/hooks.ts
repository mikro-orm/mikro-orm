import { EventType } from '@mikro-orm/core';
import { getMetadataFromDecorator } from '../utils.js';

function hook(type: EventType) {
  return function (target: any, method: string) {
    const meta = getMetadataFromDecorator(target.constructor);
    meta.hooks[type] ??= [];
    meta.hooks[type].push(method);
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

export function BeforeUpsert() {
  return hook(EventType.beforeUpsert);
}

export function AfterUpsert() {
  return hook(EventType.afterUpsert);
}

export function OnInit() {
  return hook(EventType.onInit);
}

export function OnLoad() {
  return hook(EventType.onLoad);
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
