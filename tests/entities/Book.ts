import {
  EntityDTO,
  Ref,
  Dictionary,
  Collection,
  Cascade,
  Entity,
  Index,
  ManyToMany,
  ManyToOne,
  Property,
  Unique,
  wrap,
  Filter,
  OptionalProps,
  EntityKey,
} from '@mikro-orm/core';
import { Publisher } from './Publisher.js';
import { Author } from './Author.js';
import { BookTag } from './book-tag.js';
import { BaseEntity3 } from './BaseEntity3.js';
import { BookRepository } from '../repositories/BookRepository.js';

@Entity({ tableName: 'books-table', repository: () => BookRepository })
@Unique({ properties: ['title', 'author'] })
@Index({ properties: 'title', type: 'fulltext' })
@Index({ options: { point: '2dsphere', title: -1 } })
@Filter({ name: 'writtenBy', cond: args => ({ author: args.author }) })
export class Book extends BaseEntity3 {

  [OptionalProps]?: 'createdAt';

  @Property()
  createdAt: Date = new Date();

  @Property()
  title: string;

  @Property({ lazy: true, nullable: true })
  perex?: string;

  @ManyToOne(() => Author)
  author: Author;

  @ManyToOne(() => Publisher, { ref: true, cascade: [Cascade.PERSIST, Cascade.REMOVE], nullable: true })
  @Index({ name: 'publisher_idx' })
  publisher!: Ref<Publisher> | null;

  @ManyToMany(() => BookTag, undefined, { orderBy: { name: 'asc' } })
  tags = new Collection<BookTag>(this);

  @Property({ type: 'json', nullable: true })
  metaObject?: Dictionary<unknown>;

  @Property({ nullable: true })
  metaArray?: any[];

  @Property({ nullable: true })
  metaArrayOfStrings?: string[];

  @Property({ nullable: true })
  @Index({ type: '2dsphere' })
  point?: [number, number];

  @Property({ nullable: true })
  tenant?: number;

  constructor(title: string, author?: Author) {
    super();
    this.title = title;
    this.author = author!;
  }

  toJSON<Ignored extends EntityKey<this>>(strict = true, strip: Ignored[] = ['metaObject', 'metaArray', 'metaArrayOfStrings'] as Ignored[]): Omit<EntityDTO<this>, Ignored> | EntityDTO<this> {
    if (strict) {
      return wrap(this).toObject(strip);
    }

    return wrap(this).toObject();
  }

}
