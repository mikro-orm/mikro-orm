import { EntitySchema } from '@mikro-orm/core';

export class User4 {

  id: string;
  email: string;
  agreedToTerms?: Date;

  constructor(id: string, email: string) {
    this.id = id;
    this.email = email;
  }

  agreeToTerms(): void {
    this.agreedToTerms = new Date();
  }

}

export const schema1 = new EntitySchema<User4>({
  class: User4,
  tableName: 'person',
  properties: {
    id: { type: 'string', primary: true, name: 'cognito_id' },
    email: { type: 'string' },
    agreedToTerms: { type: 'datetime', nullable: true },
  },
});
