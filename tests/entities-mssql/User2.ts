import { Collection, Entity, ManyToMany, OneToOne, PrimaryKey, Property } from '@mikro-orm/core';
import { Car2 } from './Car2.js';
import { Sandwich } from './sandwich.js';

@Entity()
export class User2 {

  @PrimaryKey({ length: 100 })
  firstName: string;

  @PrimaryKey({ length: 100 })
  lastName: string;

  @Property({ nullable: true })
  foo?: number;

  @ManyToMany({ entity: () => Car2, updateRule: 'no action', deleteRule: 'no action' })
  cars = new Collection<Car2>(this);

  @ManyToMany(() => Sandwich)
  sandwiches = new Collection<Sandwich>(this);

  @OneToOne({ entity: () => Car2, nullable: true })
  favouriteCar?: Car2;

  constructor(firstName: string, lastName: string) {
    this.firstName = firstName;
    this.lastName = lastName;
  }

}
