import { Collection, Entity, OneToMany, PrimaryKey, Property } from '@mikro-orm/core';
import { Employee2 } from './Employee2';
import { Manager2 } from './Manager2';

@Entity()
export class Company2 {

  @PrimaryKey()
  id!: number;

  @Property({ length: 100 })
  name!: string;

  @OneToMany(() => Employee2, employee => employee.company)
  employees = new Collection<Employee2>(this);

  @OneToMany(() => Manager2, manager => manager.company)
  managers = new Collection<Manager2>(this);

  constructor(name: string) {
    this.name = name;
  }

}
