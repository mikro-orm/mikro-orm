import { Collection, Entity, ManyToMany, Property } from '@mikro-orm/core';
import { Book } from './Book';
import { BaseEntity } from './BaseEntity';

@Entity()
export class BookTag extends BaseEntity {

  @Property()
  name: string;

  @ManyToMany({ entity: () => Book, mappedBy: 'tags' })
  books = new Collection<Book>(this);

  constructor(name: string) {
    super();
    this.name = name;
  }

}
