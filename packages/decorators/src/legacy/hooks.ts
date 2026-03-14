import { EventType } from '@mikro-orm/core';
import { getMetadataFromDecorator } from '../utils.js';

function hook(type: EventType) {
  return function (target: any, method: string) {
    const meta = getMetadataFromDecorator(target.constructor);
    meta.hooks[type] ??= [];
    meta.hooks[type].push(method);
  };
}

/** Called before a new entity is persisted to the database (legacy TypeScript decorator). */
export function BeforeCreate(): (target: any, method: string) => void {
  return hook(EventType.beforeCreate);
}

/** Called after a new entity has been persisted to the database (legacy TypeScript decorator). */
export function AfterCreate(): (target: any, method: string) => void {
  return hook(EventType.afterCreate);
}

/** Called before an existing entity is updated in the database (legacy TypeScript decorator). */
export function BeforeUpdate(): (target: any, method: string) => void {
  return hook(EventType.beforeUpdate);
}

/** Called after an existing entity has been updated in the database (legacy TypeScript decorator). */
export function AfterUpdate(): (target: any, method: string) => void {
  return hook(EventType.afterUpdate);
}

/** Called before an entity is upserted (legacy TypeScript decorator). */
export function BeforeUpsert(): (target: any, method: string) => void {
  return hook(EventType.beforeUpsert);
}

/** Called after an entity has been upserted (legacy TypeScript decorator). */
export function AfterUpsert(): (target: any, method: string) => void {
  return hook(EventType.afterUpsert);
}

/** Called when an entity is instantiated by the EntityManager (legacy TypeScript decorator). */
export function OnInit(): (target: any, method: string) => void {
  return hook(EventType.onInit);
}

/** Called after an entity is loaded from the database (legacy TypeScript decorator). */
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
