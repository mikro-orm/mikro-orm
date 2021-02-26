import { AfterCreate, AfterUpdate, Entity, Enum, PrimaryKey, Property } from '@mikro-orm/core';

export enum Type {
  Employee = 'employee',
  Manager = 'manager',
  Owner = 'owner',
}

@Entity({
  discriminatorColumn: 'type',
  discriminatorMap: {
    employee: 'Employee',
    manager: 'Manager',
    owner: 'CompanyOwner',
  },
})
export abstract class BaseUser {

  @PrimaryKey()
  id!: number;

  @Property({ length: 100 })
  firstName: string;

  @Property({ length: 100 })
  lastName: string;

  @Enum()
  type!: Type;

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
