import { ObjectId } from 'mongodb';
import { Entity, IEntity, ManyToOne, OneToOne, PrimaryKey, Property } from '../../lib';
import { FooBar } from './FooBar';
import { Book } from './Book';

@Entity()
export class FooBaz {

  @PrimaryKey()
  _id: ObjectId;

  @Property()
  name: string;

  @OneToOne(() => FooBar, bar => bar.baz, { eager: true })
  bar: FooBar;

  @ManyToOne({ eager: true })
  book: Book;

  static create(name: string) {
    const baz = new FooBaz();
    baz.name = name;

    return baz;
  }

}

export interface FooBaz extends IEntity<string> { }
