import { ObjectId } from 'mongodb';
import { Cascade, Collection, Entity, IdentifiedReference, Index, ManyToMany, ManyToOne, PrimaryKey, Property, Unique, wrap } from '../../lib';
import { Publisher } from './Publisher';
import { Author } from './Author';
import { BookTag } from './book-tag';
import { BaseEntity3 } from './BaseEntity3';

@Entity({ tableName: 'books-table' })
@Unique({ properties: ['title', 'author'] })
export class Book extends BaseEntity3 {

  @PrimaryKey()
  _id!: ObjectId;

  @Property()
  title: string;

  @ManyToOne()
  author: Author;

  @ManyToOne(() => Publisher, { cascade: [Cascade.PERSIST, Cascade.REMOVE] })
  @Index({ name: 'publisher_idx' })
  publisher!: IdentifiedReference<Publisher, '_id' | 'id'>;

  @ManyToMany()
  tags: Collection<BookTag> = new Collection<BookTag>(this);

  @Property()
  metaObject?: object;

  @Property()
  metaArray?: any[];

  @Property()
  metaArrayOfStrings?: string[];

  constructor(title: string, author?: Author) {
    super();
    this.title = title;
    this.author = author as Author;
  }

  toJSON(strict = true, strip = ['metaObject', 'metaArray', 'metaArrayOfStrings'], ...args: any[]): { [p: string]: any } {
    const o = wrap(this).toObject(...args);

    if (strict) {
      strip.forEach(k => delete o[k]);
    }

    return o;
  }

}
