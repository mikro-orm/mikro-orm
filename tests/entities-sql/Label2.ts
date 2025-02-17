import { Collection, Entity, ManyToMany, PrimaryKey, Property } from '@mikro-orm/core';
import { v4 } from 'uuid';
import { Test2 } from './Test2.js';

@Entity({ tableName: 'public.label2' })
export class Label2 {

  @PrimaryKey({ type: 'uuid', serializedName: 'id', serializer: value => `uuid is ${value}` })
  uuid = v4();

  @Property()
  name: string;

  @ManyToMany({ entity: () => Test2, pivotTable: 'label_schema.label2_tests', fixedOrder: true })
  tests = new Collection<Test2>(this);

  constructor(name: string) {
    this.name = name;
  }

}
