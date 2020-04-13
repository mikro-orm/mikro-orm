import { BigIntType, Collection, Entity, ManyToMany, PrimaryKey, Property, ReferenceType, wrap } from '@mikro-orm/core';
import { Book2 } from './Book2';

@Entity()
export class BookTag2 {

  @PrimaryKey({ type: BigIntType })
  id!: string;

  @Property({ length: 50 })
  name: string;

  @ManyToMany(() => Book2, book => book.tags)
  books!: Collection<Book2>;

  @ManyToMany(() => Book2, book => book.tagsUnordered)
  booksUnordered!: Collection<Book2>;

  constructor(name: string) {
    const props = wrap(this).__meta.properties;

    Object.keys(props).forEach(prop => {
      if ([ReferenceType.ONE_TO_MANY, ReferenceType.MANY_TO_MANY].includes(props[prop].reference)) {
        (this as any)[prop] = new Collection(this);
      }
    });

    this.name = name;
  }

}
