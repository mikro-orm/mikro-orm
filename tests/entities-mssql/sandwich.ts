import { Collection, Entity, ManyToMany, PrimaryKey, Property } from '@mikro-orm/core';
import { User2 } from './User2.js';

@Entity()
export class Sandwich {

  @PrimaryKey()
  id!: number;

  @Property({ length: 255 })
  name: string;

  @Property()
  price: number;

  @ManyToMany(() => User2, u => u.sandwiches)
  users: Collection<User2> = new Collection<User2>(this);

  constructor(name: string, price: number) {
    this.name = name;
    this.price = price;
  }

}
