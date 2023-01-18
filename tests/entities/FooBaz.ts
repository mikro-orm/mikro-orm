import { Entity, Index, ManyToOne, OneToOne, PrimaryKey, Property, SerializedPrimaryKey } from '@mikro-orm/core';
import { ObjectId } from 'bson';
import { Book } from './Book';
import FooBar from './FooBar';

@Entity()
export class FooBaz {

  @PrimaryKey()
  _id!: ObjectId;

  @SerializedPrimaryKey()
  id!: string;

  @Property()
  @Index()
  name!: string;

  @OneToOne(() => FooBar, bar => bar.baz, { eager: true })
  bar!: FooBar;

  @ManyToOne({ eager: true, nullable: true })
  book?: Book;

  static create(name: string) {
    const baz = new FooBaz();
    baz.name = name;

    return baz;
  }

}
