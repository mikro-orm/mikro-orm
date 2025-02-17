import {
  EagerProps,
  Entity,
  Index,
  ManyToOne,
  OneToOne,
  PrimaryKey,
  Property, Ref,
  SerializedPrimaryKey,
} from '@mikro-orm/core';
import { ObjectId } from 'bson';
import { Book } from './Book.js';
import FooBar from './FooBar.js';

@Entity()
export class FooBaz {

  [EagerProps]?: 'bar' | 'book';

  @PrimaryKey()
  _id!: ObjectId;

  @SerializedPrimaryKey()
  id!: string;

  @Property()
  @Index()
  name!: string;

  @OneToOne(() => FooBar, bar => bar.baz, { eager: true, ref: true })
  bar!: Ref<FooBar>;

  @ManyToOne(() => Book, { eager: true, nullable: true, ref: true })
  book?: Ref<Book>;

  static create(name: string) {
    const baz = new FooBaz();
    baz.name = name;

    return baz;
  }

}
