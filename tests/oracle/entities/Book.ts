import { v4 } from 'uuid';
import { Cascade, Collection, Entity, Filter, Formula, IdentifiedReference, ManyToMany, ManyToOne, OneToOne, PrimaryKey, Property, QueryOrder } from '@mikro-orm/core';
import { Publisher } from './Publisher';
import { Author } from './Author';
import { BookTag } from './BookTag';
import { Test } from './Test';

@Entity()
@Filter({ name: 'expensive', cond: { price: { $gt: 1000 } } })
@Filter({ name: 'long', cond: { 'length(perex)': { $gt: 10000 } } })
@Filter({ name: 'hasAuthor', cond: { author: { $ne: null } }, default: true })
@Filter({ name: 'writtenBy', cond: args => ({ author: { name: args.name } }) })
export class Book {

  @PrimaryKey({ name: 'uuid_pk', length: 36 })
  uuid: string = v4();

  @Property({ defaultRaw: 'current_timestamp(3)', length: 3 })
  createdAt: Date = new Date();

  @Property({ nullable: true, default: '' })
  title?: string;

  @Property({ type: 'text', nullable: true, lazy: true })
  perex?: string;

  @Property({ type: 'float', nullable: true })
  price?: number;

  @Formula(alias => `${alias}.price * 1.19`)
  priceTaxed?: number;

  @Property({ type: 'double', nullable: true })
  double?: number;

  @Property({ nullable: true })
  meta?: BookMeta;

  @ManyToOne({ entity: 'Author', cascade: [] })
  author: Author;

  @ManyToOne(() => Publisher, { cascade: [Cascade.PERSIST, Cascade.REMOVE], nullable: true, wrappedReference: true })
  publisher?: IdentifiedReference<Publisher>;

  @OneToOne({ cascade: [], mappedBy: 'book', nullable: true })
  test?: Test;

  @ManyToMany({ entity: () => BookTag, cascade: [], fixedOrderColumn: 'order' })
  tags = new Collection<BookTag>(this);

  @ManyToMany(() => BookTag, undefined, { pivotTable: 'book_to_tag_unordered', orderBy: { name: QueryOrder.ASC } })
  tagsUnordered = new Collection<BookTag>(this);

  constructor(title: string, author: Author, price?: number) {
    this.title = title;
    this.author = author;

    if (price) {
      this.price = price;
    }
  }

}

export interface BookMeta {
  category: string;
  items: number;
}
