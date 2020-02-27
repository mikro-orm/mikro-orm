import { BigIntType, Collection, Entity, ManyToMany, PrimaryKey, Property, ReferenceType } from '../../lib';
import { Book2 } from './Book2';
import { MetadataStorage } from '../../lib/metadata';

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
    const meta = MetadataStorage.getMetadata(this.constructor.name);
    const props = meta.properties;

    Object.keys(props).forEach(prop => {
      if ([ReferenceType.ONE_TO_MANY, ReferenceType.MANY_TO_MANY].includes(props[prop].reference)) {
        (this as any)[prop] = new Collection(this);
      }
    });

    this.name = name;
  }

}
