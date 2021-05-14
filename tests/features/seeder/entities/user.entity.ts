import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

@Entity()
export class User {

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
