import { Entity, ManyToOne, PrimaryKey, Property } from '@mikro-orm/core';
import { Car2 } from './Car2';

@Entity()
export class CarOwner2 {

  @PrimaryKey()
  id!: number;

  @Property()
  name: string;

  @ManyToOne(() => Car2, { index: 'car_owner2_car_name_car_year_idx' })
  car!: Car2;

  constructor(name: string) {
    this.name = name;
  }

}
