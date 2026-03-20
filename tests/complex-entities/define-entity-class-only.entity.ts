import { defineEntity, p } from '@mikro-orm/core';

// Only the class is exported, not the schema.
// Glob discovery should still find this entity via EntitySchema.REGISTRY.
const UserSchema = defineEntity({
  name: 'User',
  properties: {
    id: p.integer().primary(),
    fullName: p.string(),
    email: p.string(),
  },
});

export class User extends UserSchema.class {}

UserSchema.setClass(User);
