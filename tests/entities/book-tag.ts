import { ObjectId } from 'mongodb';
import { Collection, Entity, ManyToMany, PrimaryKey, Property, MongoEntity } from '../../lib';
import { Book } from './Book';
import { SerializedPrimaryKey } from '../../lib/decorators';

@Entity()
export class BookTag implements MongoEntity<BookTag> {

  @PrimaryKey()
  _id!: ObjectId;

  @SerializedPrimaryKey()
  id!: string;

  @Property()
  name: string;

  @ManyToMany(() => Book, 'tags')
  books: Collection<Book> = new Collection<Book>(this);

  constructor(name: string) {
    this.name = name;
  }

}
