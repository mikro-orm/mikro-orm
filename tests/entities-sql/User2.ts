import { Collection, Entity, ManyToMany, PrimaryKey, Property } from '@mikro-orm/core';
import { Car2 } from './Car2';
import { Sandwich } from './sandwich';

@Entity()
export class User2 {

  @PrimaryKey({ length: 100 })
  firstName: string;

  @PrimaryKey({ length: 100 })
  lastName: string;

  @Property({ nullable: true })
  foo?: number;

  @ManyToMany(() => Car2)
  cars = new Collection<Car2>(this);

  @ManyToMany(() => Sandwich)
  sandwiches = new Collection<Sandwich>(this);

  constructor(firstName: string, lastName: string) {
    this.firstName = firstName;
    this.lastName = lastName;
  }

}
