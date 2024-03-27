import { Entity, PrimaryKey, Property } from '@mikro-orm/core';
import { v4 } from 'uuid';

@Entity()
export class Label2 {

  @PrimaryKey({ type: 'uuid' })
  uuid: string = v4();

  @Property()
  name: string;

  constructor(name: string) {
    this.name = name;
  }

}
