import { Collection, Entity, ManyToMany, PrimaryKey, Property } from '@mikro-orm/core';
import { User } from './User';

@Entity()
export class Sandwich {

  @PrimaryKey()
  id!: number;

  @Property({ length: 55 })
  name: string;

  @Property()
  price: number;

  @ManyToMany(() => User, u => u.sandwiches)
  users = new Collection<User>(this);

  constructor(name: string, price: number) {
    this.name = name;
    this.price = price;
  }

}
