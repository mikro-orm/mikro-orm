import { Collection, Entity, ManyToMany, OneToOne, PrimaryKey, Property } from '@mikro-orm/core';
import { Car } from './Car';
import { Sandwich } from './sandwich';

@Entity()
export class User {

  @PrimaryKey({ length: 100 })
  firstName: string;

  @PrimaryKey({ length: 100 })
  lastName: string;

  @Property({ nullable: true })
  foo?: number;

  @ManyToMany(() => Car)
  cars = new Collection<Car>(this);

  @ManyToMany(() => Sandwich)
  sandwiches = new Collection<Sandwich>(this);

  @OneToOne({ entity: () => Car, nullable: true })
  favouriteCar?: Car;

  constructor(firstName: string, lastName: string) {
    this.firstName = firstName;
    this.lastName = lastName;
  }

}
