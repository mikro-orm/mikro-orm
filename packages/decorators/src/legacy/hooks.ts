import { EventType } from '@mikro-orm/core';
import { getMetadataFromDecorator } from '../utils.js';

function hook(type: EventType) {
  return function (target: any, method: string) {
    const meta = getMetadataFromDecorator(target.constructor);
    meta.hooks[type] ??= [];
    meta.hooks[type].push(method);
  };
}

export function BeforeCreate(): (target: any, method: string) => void {
  return hook(EventType.beforeCreate);
}

export function AfterCreate(): (target: any, method: string) => void {
  return hook(EventType.afterCreate);
}

export function BeforeUpdate(): (target: any, method: string) => void {
  return hook(EventType.beforeUpdate);
}

export function AfterUpdate(): (target: any, method: string) => void {
  return hook(EventType.afterUpdate);
}

export function BeforeUpsert(): (target: any, method: string) => void {
  return hook(EventType.beforeUpsert);
}

export function AfterUpsert(): (target: any, method: string) => void {
  return hook(EventType.afterUpsert);
}

export function OnInit(): (target: any, method: string) => void {
  return hook(EventType.onInit);
}

export function OnLoad(): (target: any, method: string) => void {
  return hook(EventType.onLoad);
}

/**
 * Called before deleting entity, but only when providing initialized entity to EM#remove()
 */
export function BeforeDelete(): (target: any, method: string) => void {
  return hook(EventType.beforeDelete);
}

/**
 * Called after deleting entity, but only when providing initialized entity to EM#remove()
 */
export function AfterDelete(): (target: any, method: string) => void {
  return hook(EventType.afterDelete);
}
