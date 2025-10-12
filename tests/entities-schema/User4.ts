import { defineEntity, p } from '@mikro-orm/core';

export class User4 {

  id: string;
  email: string;
  agreedToTerms?: Date;
  firstName!: string;
  lastName!: string;

  constructor(id: string, email: string) {
    this.id = id;
    this.email = email;
  }

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  agreeToTerms(): void {
    this.agreedToTerms = new Date();
  }

}

export const UserSchema = defineEntity({
  class: User4,
  tableName: 'person',
  properties: {
    id: p.string().primary().name('cognito_id'),
    email: p.string(),
    agreedToTerms: p.datetime().nullable(),
    firstName: p.string(),
    lastName: p.string(),
    fullName: p.type('method').persist(false).getter(),
  },
});
