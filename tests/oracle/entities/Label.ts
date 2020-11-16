import { Entity, PrimaryKey, Property } from '@mikro-orm/core';
import { v4 } from 'uuid';

@Entity()
export class Label {

  @PrimaryKey({ type: 'uuid', serializedName: 'id', serializer: value => `uuid is ${value}` })
  uuid = v4();

  @Property()
  name: string;

  constructor(name: string) {
    this.name = name;
  }

}
