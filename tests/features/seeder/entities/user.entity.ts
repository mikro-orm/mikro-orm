import { OptionalProps } from '@mikro-orm/core';

import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
@Entity()
export class User {

  [OptionalProps]?: 'createdAt';

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Property()
  email!: string;

  @Property()
  password!: string;

  @Property()
  createdAt: Date = new Date();

}
