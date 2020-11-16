import { BigIntType, Collection, Entity, ManyToMany, PrimaryKey, Property, ReferenceType, wrap } from '@mikro-orm/core';
import { Book } from './Book';

@Entity()
export class BookTag {

  @PrimaryKey({ type: BigIntType })
  id!: string;

  @Property({ length: 50 })
  name: string;

  @ManyToMany(() => Book, book => book.tags)
  books!: Collection<Book>;

  @ManyToMany(() => Book, book => book.tagsUnordered)
  booksUnordered!: Collection<Book>;

  constructor(name: string) {
    const props = wrap(this, true).__meta.properties;

    Object.keys(props).forEach(prop => {
      if ([ReferenceType.ONE_TO_MANY, ReferenceType.MANY_TO_MANY].includes(props[prop].reference)) {
        (this as any)[prop] = new Collection(this);
      }
    });

    this.name = name;
  }

}
