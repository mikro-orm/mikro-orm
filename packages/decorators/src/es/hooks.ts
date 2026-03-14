import { EventType, type EntityMetadata } from '@mikro-orm/core';

function hook<Owner extends object>(type: EventType) {
  return function (value: (...args: any[]) => unknown, context: ClassMethodDecoratorContext) {
    const meta = context.metadata as Partial<EntityMetadata<Owner>>;
    meta.hooks ??= {};
    meta.hooks[type] ??= [];
    meta.hooks[type].push(value);
  };
}

/** Called before a new entity is persisted to the database (TC39 decorator). */
export function BeforeCreate(): (value: (...args: any[]) => unknown, context: ClassMethodDecoratorContext) => void {
  return hook(EventType.beforeCreate);
}

/** Called after a new entity has been persisted to the database (TC39 decorator). */
export function AfterCreate(): (value: (...args: any[]) => unknown, context: ClassMethodDecoratorContext) => void {
  return hook(EventType.afterCreate);
}

/** Called before an existing entity is updated in the database (TC39 decorator). */
export function BeforeUpdate(): (value: (...args: any[]) => unknown, context: ClassMethodDecoratorContext) => void {
  return hook(EventType.beforeUpdate);
}

/** Called after an existing entity has been updated in the database (TC39 decorator). */
export function AfterUpdate(): (value: (...args: any[]) => unknown, context: ClassMethodDecoratorContext) => void {
  return hook(EventType.afterUpdate);
}

/** Called before an entity is upserted (TC39 decorator). */
export function BeforeUpsert(): (value: (...args: any[]) => unknown, context: ClassMethodDecoratorContext) => void {
  return hook(EventType.beforeUpsert);
}

/** Called after an entity has been upserted (TC39 decorator). */
export function AfterUpsert(): (value: (...args: any[]) => unknown, context: ClassMethodDecoratorContext) => void {
  return hook(EventType.afterUpsert);
}

/** Called when an entity is instantiated by the EntityManager (TC39 decorator). */
export function OnInit(): (value: (...args: any[]) => unknown, context: ClassMethodDecoratorContext) => void {
  return hook(EventType.onInit);
}

/** Called after an entity is loaded from the database (TC39 decorator). */
export function OnLoad(): (value: (...args: any[]) => unknown, context: ClassMethodDecoratorContext) => void {
  return hook(EventType.onLoad);
}

/**
 * Called before deleting entity, but only when providing initialized entity to EM#remove()
 */
export function BeforeDelete(): (value: (...args: any[]) => unknown, context: ClassMethodDecoratorContext) => void {
  return hook(EventType.beforeDelete);
}

/**
 * Called after deleting entity, but only when providing initialized entity to EM#remove()
 */
export function AfterDelete(): (value: (...args: any[]) => unknown, context: ClassMethodDecoratorContext) => void {
  return hook(EventType.afterDelete);
}
