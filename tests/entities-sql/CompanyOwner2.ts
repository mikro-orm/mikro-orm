import { AfterCreate, AfterUpdate, Entity, ManyToOne, OneToOne, Property } from '@mikro-orm/core';
import { Manager2 } from './Manager2.js';
import { Employee2 } from './Employee2.js';

@Entity()
export class CompanyOwner2 extends Manager2 {

  @Property()
  ownerProp!: string;

  @ManyToOne(() => Employee2, { nullable: true })
  favouriteEmployee?: Employee2;

  @OneToOne({ entity: () => Manager2, nullable: true })
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
