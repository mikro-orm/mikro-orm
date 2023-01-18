import { Cascade, Entity, ManyToMany, ManyToOne, Property } from '@mikro-orm/core';
import type { Publisher } from './Publisher';
import { Author } from './Author';
import type { BookTag } from './BookTag';
import { Collection, IdentifiedReference } from '../TsMorphMetadataProvider.test';
import { BaseEntity3 } from './BaseEntity3';

@Entity()
export class Book extends BaseEntity3 {

  @Property()
  title: string;

  @ManyToOne()
  author: Author;

  @ManyToOne({ cascade: [Cascade.PERSIST, Cascade.REMOVE] })
  publisher!: IdentifiedReference<Publisher, '_id' | 'id'>;

  @ManyToMany()
  tags = new Collection<BookTag>(this);

  @Property()
  metaObject?: object;

  @Property()
  metaArray?: any[];

  @Property()
  metaArrayOfStrings?: string[];

  constructor(title: string, author?: Author) {
    super();
    this.title = title;
    this.author = author!;
  }

}
