import { Entity, PrimaryKey, Property } from '@mikro-orm/core';
import { v4 as uuid } from 'uuid';

@Entity()
export class User3 {

  @PrimaryKey({ hidden: false })
  _id!: number;

  @Property({ unique: true, length: 36 })
  id: string = uuid();

  @Property()
  name!: string;

  constructor(name: string) {
    this.name = name;
  }

}
