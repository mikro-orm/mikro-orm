import { EventType, type EntityMetadata } from '@mikro-orm/core';

function hook<Owner extends object>(type: EventType) {
  return function (value: (...args: any[]) => unknown, context: ClassMethodDecoratorContext) {
    const meta = context.metadata as Partial<EntityMetadata<Owner>>;
    meta.hooks ??= {};
    meta.hooks[type] ??= [];
    meta.hooks[type].push(value);
  };
}

export function BeforeCreate(): (value: (...args: any[]) => unknown, context: ClassMethodDecoratorContext) => void {
  return hook(EventType.beforeCreate);
}

export function AfterCreate(): (value: (...args: any[]) => unknown, context: ClassMethodDecoratorContext) => void {
  return hook(EventType.afterCreate);
}

export function BeforeUpdate(): (value: (...args: any[]) => unknown, context: ClassMethodDecoratorContext) => void {
  return hook(EventType.beforeUpdate);
}

export function AfterUpdate(): (value: (...args: any[]) => unknown, context: ClassMethodDecoratorContext) => void {
  return hook(EventType.afterUpdate);
}

export function BeforeUpsert(): (value: (...args: any[]) => unknown, context: ClassMethodDecoratorContext) => void {
  return hook(EventType.beforeUpsert);
}

export function AfterUpsert(): (value: (...args: any[]) => unknown, context: ClassMethodDecoratorContext) => void {
  return hook(EventType.afterUpsert);
}

export function OnInit(): (value: (...args: any[]) => unknown, context: ClassMethodDecoratorContext) => void {
  return hook(EventType.onInit);
}

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
