import { ObjectId } from 'bson';
import { Entity, ManyToOne, OneToOne, PrimaryKey, Property, SerializedPrimaryKey } from '@mikro-orm/core';
import FooBar from './FooBar';
import { Book } from './Book';

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

  @ManyToOne({ eager: true })
  book!: Book;

  static create(name: string) {
    const baz = new FooBaz();
    baz.name = name;

    return baz;
  }

}
