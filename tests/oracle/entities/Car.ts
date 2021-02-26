import { Collection, Entity, Index, ManyToMany, OneToOne, PrimaryKey, PrimaryKeyType, Property } from '@mikro-orm/core';
import { User } from './User';
import { Test } from './Test';

@Entity()
export class Car {

  @Index({ name: 'car_name_index' })
  @PrimaryKey({ length: 100 })
  name: string;

  @Index({ name: 'car_year_index' })
  @PrimaryKey()
  year: number;

  @Property()
  price: number;

  @ManyToMany(() => User, u => u.cars)
  users = new Collection<User>(this);

  [PrimaryKeyType]: [string, number];

  constructor(name: string, year: number, price: number) {
    this.name = name;
    this.year = year;
    this.price = price;
  }

}
