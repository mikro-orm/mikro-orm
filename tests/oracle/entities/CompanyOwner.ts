import { AfterCreate, AfterUpdate, Entity, ManyToOne, OneToOne, Property } from '@mikro-orm/core';
import { Manager } from './Manager';
import { Employee } from './Employee';

@Entity()
export class CompanyOwner extends Manager {

  @Property()
  ownerProp!: string;

  @ManyToOne(() => Employee)
  favouriteEmployee?: Employee;

  @OneToOne(() => Manager)
  favouriteManager?: Manager;

  state?: string;

  @AfterCreate()
  afterCreate() {
    this.state = 'created';
  }

  @AfterUpdate()
  afterUpdate() {
    this.state = 'updated';
  }

}
