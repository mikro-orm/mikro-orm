import { Cascade, Entity, ManyToMany, ManyToOne, Property } from '@mikro-orm/core';
import type { Publisher } from './Publisher.js';
import { Author } from './Author.js';
import type { BookTag } from './BookTag.js';
import { Collection, Ref } from '../TsMorphMetadataProvider.test.js';
import { BaseEntity3 } from './BaseEntity3.js';

@Entity()
export class Book extends BaseEntity3 {

  @Property()
  title: string;

  @ManyToOne()
  author: Author;

  @ManyToOne({ cascade: [Cascade.PERSIST, Cascade.REMOVE] })
  publisher!: Ref<Publisher>;

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
