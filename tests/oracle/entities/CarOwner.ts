import { Entity, ManyToOne, PrimaryKey, Property } from '@mikro-orm/core';
import { Car } from './Car';

@Entity()
export class CarOwner {

  @PrimaryKey()
  id!: number;

  @Property()
  name: string;

  @ManyToOne(() => Car, { index: 'car_owner_car_name_car_year_idx' })
  car!: Car;

  constructor(name: string) {
    this.name = name;
  }

}
