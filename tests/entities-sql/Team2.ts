import { Entity, Property } from '@mikro-orm/core';
import { BaseEntity2 } from './BaseEntity2';

@Entity({ tableName: `test123.team` })
export class Team2 extends BaseEntity2 {

  @Property()
  name: string;

  constructor(name: string) {
    super();
    this.name = name;
  }

}
