import { Collection } from '@mikro-orm/core';
import { Entity, OneToMany, OneToOne, Property } from '@mikro-orm/decorators/legacy';
import { Book } from './Book.js';
import { BaseEntity } from './BaseEntity.js';
import { PublisherAddress } from './PublisherAddress.js';

@Entity()
export class Publisher extends BaseEntity {
  @Property()
  name: string;

  @OneToOne({ entity: () => PublisherAddress, mappedBy: 'publisher' })
  address: PublisherAddress;

  @OneToMany({ entity: () => Book, mappedBy: 'publisher' })
  books = new Collection<Book>(this);

  constructor(name: string, address: PublisherAddress) {
    super();
    this.name = name;
    this.address = address;
  }
}
