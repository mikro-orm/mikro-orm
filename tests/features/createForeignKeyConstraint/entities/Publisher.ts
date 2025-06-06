import { Collection, Entity, OneToMany, OneToOne, Property } from '@mikro-orm/core';
import { Book } from './Book';
import { BaseEntity } from './BaseEntity';
import { PublisherAddress } from './PublisherAddress';

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
