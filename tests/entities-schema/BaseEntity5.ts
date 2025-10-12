import { defineEntity, InferEntity, p } from '@mikro-orm/core';

export const BaseProperties = {
  id: p.integer().primary(),
  createdAt: p.datetime().onCreate(() => new Date()).nullable(),
  updatedAt: p.datetime().onCreate(() => new Date()).onUpdate(() => new Date()).nullable(),
};

export const BaseEntity5 = defineEntity({
  name: 'BaseEntity5',
  abstract: true,
  properties: BaseProperties,
});

export interface IBaseEntity5 extends InferEntity<typeof BaseEntity5> {}
