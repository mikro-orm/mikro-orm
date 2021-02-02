import { v4 } from 'uuid';
import { Cascade, Collection, Entity, Filter, Formula, IdentifiedReference, JsonType, ManyToMany, ManyToOne, OneToOne, PrimaryKey, Property, QueryOrder } from '@mikro-orm/core';
import { Publisher2 } from './Publisher2';
import { Author2 } from './Author2';
import { BookTag2 } from './BookTag2';
import { Test2 } from './Test2';

@Entity()
@Filter({ name: 'expensive', cond: { price: { $gt: 1000 } } })
@Filter({ name: 'long', cond: { 'length(perex)': { $gt: 10000 } } })
@Filter({ name: 'hasAuthor', cond: { author: { $ne: null } }, default: true })
@Filter({ name: 'writtenBy', cond: args => ({ author: { name: args.name } }) })
export class Book2 {

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

  @Property({ nullable: true, type: JsonType })
  meta?: Book2Meta;

  @ManyToOne({ entity: 'Author2', cascade: [] })
  author: Author2;

  @ManyToOne(() => Publisher2, { cascade: [Cascade.PERSIST, Cascade.REMOVE], nullable: true, wrappedReference: true })
  publisher?: IdentifiedReference<Publisher2>;

  @OneToOne({ cascade: [], mappedBy: 'book', nullable: true })
  test?: Test2;

  @ManyToMany({ entity: () => BookTag2, cascade: [], fixedOrderColumn: 'order' })
  tags = new Collection<BookTag2>(this);

  @ManyToMany(() => BookTag2, undefined, { pivotTable: 'book_to_tag_unordered', orderBy: { name: QueryOrder.ASC } })
  tagsUnordered = new Collection<BookTag2>(this);

  constructor(title: string, author: Author2, price?: number) {
    this.title = title;
    this.author = author;

    if (price) {
      this.price = price;
    }
  }

}

export interface Book2Meta {
  category: string;
  items: number;
  valid?: boolean;
  nested?: { foo: string; bar?: number; deep?: { baz: number; qux: boolean } };
}
