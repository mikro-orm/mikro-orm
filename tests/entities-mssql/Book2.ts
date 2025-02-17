import { v4 } from 'uuid';
import {
  Cascade,
  Collection,
  Entity,
  Filter,
  Formula,
  Ref,
  JsonType,
  ManyToMany,
  ManyToOne,
  OneToOne,
  OptionalProps,
  PrimaryKey,
  Property,
  QueryOrder,
  t,
  Unique,
} from '@mikro-orm/core';
import { Publisher2 } from './Publisher2.js';
import { Author2 } from './Author2.js';
import { BookTag2 } from './BookTag2.js';
import { Test2 } from './Test2.js';

@Entity()
@Filter({ name: 'expensive', cond: { price: { $gt: 1000 } } })
@Filter({ name: 'long', cond: { 'length(perex)': { $gt: 10000 } } })
@Filter({ name: 'hasAuthor', cond: { author: { $ne: null } }, default: true })
@Filter({ name: 'writtenBy', cond: args => ({ author: { name: args.name } }) })
export class Book2 {

  [OptionalProps]?: 'createdAt';

  @PrimaryKey({ name: 'uuid_pk', type: 'uuid' })
  uuid = v4().toUpperCase();

  @Property({ defaultRaw: 'current_timestamp', length: 3 })
  createdAt: Date = new Date();

  @Unique()
  @Property({ type: 'character', length: 13, nullable: true })
  isbn?: string;

  @Property({ nullable: true, default: '' })
  title?: string;

  @Property({ type: 'text', nullable: true, lazy: true })
  perex?: string;

  @Property({ type: t.decimal, precision: 8, scale: 2, nullable: true })
  price?: number;

  @Formula(alias => `(${alias}.[price] * 1.19)`)
  priceTaxed?: number;

  @Property({ type: 'float', nullable: true })
  float?: number;

  @Property({ columnType: 'float(36)', nullable: true })
  float36?: number;

  @Property({ type: 'double', nullable: true })
  double?: number;

  @Property({ nullable: true, type: JsonType })
  meta?: Book2Meta;

  @ManyToOne({ entity: 'Author2', cascade: [] })
  author: Author2;

  @ManyToOne(() => Publisher2, { cascade: [Cascade.PERSIST, Cascade.REMOVE], nullable: true, ref: true })
  publisher?: Ref<Publisher2>;

  @OneToOne({ cascade: [], mappedBy: 'book', nullable: true, lazy: true })
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
  category?: string;
  items?: number;
  valid?: boolean;
  nested?: {
    foo: string;
    bar?: number;
    num?: number;
    deep?: { baz: number; qux: boolean; str?: string };
  };
}
