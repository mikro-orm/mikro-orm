import { AfterCreate, AfterUpdate, Entity, ManyToOne, OneToOne, Property } from '@mikro-orm/core';
import { Manager2 } from './Manager2';
import { Employee2 } from './Employee2';

@Entity()
export class CompanyOwner2 extends Manager2 {

  @Property()
  ownerProp!: string;

  @ManyToOne(() => Employee2)
  favouriteEmployee?: Employee2;

  @OneToOne(() => Manager2)
  favouriteManager?: Manager2;

  state?: string;

  @AfterCreate()
  afterCreate2() {
    this.state = 'created';
  }

  @AfterUpdate()
  afterUpdate2() {
    this.state = 'updated';
  }

}
