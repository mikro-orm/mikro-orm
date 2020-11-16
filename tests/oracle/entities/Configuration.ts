import { Entity, ManyToOne, PrimaryKey, Property } from '@mikro-orm/core';
import { Test } from './Test';

@Entity()
export class Configuration {

  @PrimaryKey()
  property: string;

  @ManyToOne(() => Test, { primary: true })
  test: Test;

  @Property()
  value: string;

  constructor(test: Test, property: string, value: string) {
    this.test = test;
    this.property = property;
    this.value = value;
  }

}
