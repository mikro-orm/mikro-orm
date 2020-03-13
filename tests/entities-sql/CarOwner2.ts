import { Entity, ManyToOne, PrimaryKey, Property } from '../../lib';
import { Car2 } from './Car2';

@Entity()
export class CarOwner2 {

  @PrimaryKey()
  id!: number;

  @Property()
  name: string;

  @ManyToOne(() => Car2)
  car?: Car2;

  constructor(name: string) {
    this.name = name;
  }

}
