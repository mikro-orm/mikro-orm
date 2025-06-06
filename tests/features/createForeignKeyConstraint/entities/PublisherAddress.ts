import { Entity, Property, OneToOne } from '@mikro-orm/core';
import { Publisher } from './Publisher';

@Entity()
export class PublisherAddress {

  @OneToOne({ entity: () => Publisher, primary: true, createForeignKeyConstraint: false })
  publisher: Publisher;

  @Property()
  value: string;

  constructor(publisher: Publisher, value: string) {
    this.publisher = publisher;
    this.value = value;
  }

}
