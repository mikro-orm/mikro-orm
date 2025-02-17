import { ObjectId } from 'bson';
import { Entity, ManyToOne, OneToOne, PrimaryKey, Property, SerializedPrimaryKey } from '@mikro-orm/core';
import FooBar from './FooBar.js';
import { Book } from './Book.js';

@Entity()
export class FooBaz {

  @PrimaryKey()
  _id!: ObjectId;

  @SerializedPrimaryKey()
  id!: string;

  @Property()
  name!: string;

  @OneToOne(() => FooBar, bar => bar.baz, { eager: true })
  bar!: FooBar;

  @ManyToOne(() => Book, { eager: true })
  book!: Book;

}
