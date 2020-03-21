import { Collection, Entity, ManyToMany, PrimaryKey, PrimaryKeyType, Property } from '../../lib';
import { User2 } from './User2';

@Entity()
export class Car2 {

  @PrimaryKey({ length: 100 })
  name: string;

  @PrimaryKey()
  year: number;

  @Property()
  price: number;

  @ManyToMany(() => User2, u => u.cars)
  users: Collection<User2> = new Collection<User2>(this);

  [PrimaryKeyType]: [string, number];

  constructor(name: string, year: number, price: number) {
    this.name = name;
    this.year = year;
    this.price = price;
  }

}
