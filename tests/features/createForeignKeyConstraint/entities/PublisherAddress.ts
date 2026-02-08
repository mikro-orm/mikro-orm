import { Entity, OneToOne, Property } from '@mikro-orm/decorators/legacy';
import { Publisher } from './Publisher.js';

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
