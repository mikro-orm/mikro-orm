import { ObjectId } from 'mongodb';
import { Collection, IdentifiedReference, Cascade, Entity, Index, ManyToMany, ManyToOne, PrimaryKey, Property, Unique, wrap, Filter, Dictionary, EntityDTO } from '@mikro-orm/core';
import { Publisher } from './Publisher';
import { Author } from './Author';
import { BookTag } from './book-tag';
import { BaseEntity3 } from './BaseEntity3';

@Entity({ tableName: 'books-table' })
@Unique({ properties: ['title', 'author'] })
@Index({ properties: 'title', type: 'text' })
@Index({ options: { point: '2dsphere', title: -1 } })
@Filter({ name: 'writtenBy', cond: args => ({ author: args.author }) })
export class Book extends BaseEntity3<Book> {

  @PrimaryKey()
  _id!: ObjectId;

  @Property()
  createdAt: Date = new Date();

  @Property()
  title: string;

  @Property({ lazy: true })
  perex?: string;

  @ManyToOne(() => Author)
  author: Author;

  @ManyToOne(() => Publisher, { wrappedReference: true, cascade: [Cascade.PERSIST, Cascade.REMOVE] })
  @Index({ name: 'publisher_idx' })
  publisher!: IdentifiedReference<Publisher, '_id' | 'id'>;

  @ManyToMany(() => BookTag)
  tags = new Collection<BookTag>(this);

  @Property({ type: 'json' })
  metaObject?: Dictionary<unknown>;

  @Property()
  metaArray?: any[];

  @Property()
  metaArrayOfStrings?: string[];

  @Property()
  @Index({ type: '2dsphere' })
  point?: [number, number];

  @Property()
  tenant?: number;

  constructor(title: string, author?: Author) {
    super();
    this.title = title;
    this.author = author!;
  }

  toJSON(strict = true, strip = ['metaObject', 'metaArray', 'metaArrayOfStrings'], ...args: any[]): EntityDTO<Book> {
    const o = wrap(this as Book).toObject(...args);

    if (strict) {
      strip.forEach(k => delete o[k]);
    }

    return o;
  }

}
