import { v4 } from 'uuid';
import {
  Cascade,
  Collection,
  Entity,
  Filter,
  Formula,
  Ref,
  Index,
  ManyToMany,
  ManyToOne,
  OneToOne,
  OptionalProps,
  PrimaryKey,
  Property,
  QueryOrder,
  ref,
  rel,
  t,
  sql,
  Unique,
  raw,
} from '@mikro-orm/core';
import { Publisher2 } from './Publisher2.js';
import { Author2 } from './Author2.js';
import { BookTag2 } from './BookTag2.js';
import { Test2 } from './Test2.js';

@Entity()
@Filter({ name: 'expensive', cond: { price: { $gt: 1000 } } })
@Filter({ name: 'long', cond: () => ({ [sql`length(perex)`]: { $gt: 10000 } }) })
@Filter({ name: 'hasAuthor', cond: { author: { $ne: null } }, default: true })
@Filter({ name: 'writtenBy', cond: args => ({ author: { name: args.name } }) })
export class Book2 {

  [OptionalProps]?: 'createdAt';

  @PrimaryKey({ name: 'uuid_pk', type: t.uuid })
  uuid = v4();

  @Property({ default: sql.now(3), length: 3 })
  createdAt = new Date();

  @Unique()
  @Property({ type: 'character', length: 13, nullable: true })
  isbn?: string;

  @Index({ type: 'fulltext' })
  @Property({ nullable: true, default: '' })
  title?: string;

  @Property({ type: t.text, nullable: true, lazy: true, ref: true })
  perex?: Ref<string>;

  @Property({ type: t.decimal, precision: 8, scale: 2, nullable: true })
  price?: number;

  @Formula(alias => raw(`${alias}.?? * 1.19`, ['price']))
  priceTaxed?: string;

  @Property({ type: t.double, nullable: true })
  double?: number;

  @Property({ nullable: true, type: t.json })
  meta?: Book2Meta;

  @ManyToOne({ entity: 'Author2', cascade: [] })
  author: Author2;

  @ManyToOne(() => Publisher2, { cascade: [Cascade.PERSIST, Cascade.REMOVE], nullable: true, ref: true })
  publisher?: Ref<Publisher2>;

  @OneToOne({ cascade: [], mappedBy: 'book', nullable: true })
  test?: Test2;

  @ManyToMany({ entity: () => BookTag2, cascade: [], fixedOrderColumn: 'order' })
  tags = new Collection<BookTag2>(this);

  @ManyToMany(() => BookTag2, undefined, { pivotTable: 'book_to_tag_unordered', orderBy: { name: QueryOrder.ASC } })
  tagsUnordered = new Collection<BookTag2>(this);

  constructor(title: string, author: number | Author2, price?: number, isbn?: string, publisher?: number | Publisher2) {
    this.title = title;
    this.author = rel(Author2, author);
    this.publisher = ref(Publisher2, publisher);

    if (price) {
      this.price = price;
    }
    if (isbn) {
      this.isbn = isbn;
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
