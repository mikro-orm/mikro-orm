import { Collection } from '@mikro-orm/core';
import { Entity, ManyToMany, Property } from '@mikro-orm/decorators/legacy';
import { Book } from './Book.js';
import { BaseEntity } from './BaseEntity.js';

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
