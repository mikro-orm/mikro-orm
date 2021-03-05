import { Collection, Entity, ManyToMany, OneToOne, PrimaryKey, Property } from '@mikro-orm/core';

@Entity()
export class ConcurrencyCheckUser {

  @PrimaryKey({ length: 100 })
  firstName: string;

  @PrimaryKey({ length: 100, concurrencyCheck: true })
  lastName: string;

  @Property({ concurrencyCheck: true })
  age: number;

  constructor(firstName: string, lastName: string, age: number) {
    this.firstName = firstName;
    this.lastName = lastName;
    this.age = age;
  }

}
