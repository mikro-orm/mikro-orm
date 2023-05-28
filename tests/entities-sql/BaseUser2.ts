import { AfterCreate, AfterUpdate, Entity, Enum, ManyToOne, PrimaryKey, Property, Ref } from '@mikro-orm/core';
import { Company2 } from './index';

export enum Type {
  Employee = 'employee',
  Manager = 'manager',
  Owner = 'owner',
}

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

  @ManyToOne(() => Company2, { wrappedReference: true, nullable: true })
  company?: Ref<Company2>;

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
