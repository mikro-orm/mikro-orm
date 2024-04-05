import { AfterCreate, AfterUpdate, Entity, PrimaryKey, Property } from '@mikro-orm/core';

@Entity({
  discriminatorColumn: 'type',
  discriminatorMap: {
    employee: 'Employee2',
    manager: 'Manager2',
    owner: 'CompanyOwner2',
  },
})
export abstract class BaseUser2 {

  @PrimaryKey()
  id!: number;

  @Property({ length: 100 })
  firstName: string;

  @Property({ length: 100 })
  lastName: string;

  baseState?: string;

  constructor(firstName: string, lastName: string) {
    this.firstName = firstName;
    this.lastName = lastName;
  }

  @AfterCreate()
  afterCreate1() {
    this.baseState = 'created';
  }

  @AfterUpdate()
  afterUpdate1() {
    this.baseState = 'updated';
  }

}
