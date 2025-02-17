import {
  Collection,
  Entity,
  Index,
  ManyToMany,
  PrimaryKey,
  PrimaryKeyProp,
  Property,
  t,
} from '@mikro-orm/core';
import { User2 } from './User2.js';

@Entity()
export class Car2 {

  @Index({ name: 'car2_name_index' })
  @PrimaryKey({ length: 100 })
  name: string;

  @Index({ name: 'car2_year_index' })
  @PrimaryKey()
  year: number;

  @Property({ type: t.integer })
  price: number;

  @ManyToMany(() => User2, u => u.cars)
  users = new Collection<User2>(this);

  [PrimaryKeyProp]?: ['name', 'year'];

  constructor(name: string, year: number, price: number) {
    this.name = name;
    this.year = year;
    this.price = price;
  }

}
