import { ObjectId } from 'mongodb';
import { Entity, IEntity, OneToOne, PrimaryKey, Property } from '../../lib';
import { FooBar } from './FooBar';

@Entity()
export class FooBaz {

  @PrimaryKey()
  _id: ObjectId;

  @Property()
  name: string;

  @OneToOne(() => FooBar, bar => bar.baz)
  bar: FooBar;

  static create(name: string) {
    const baz = new FooBaz();
    baz.name = name;

    return baz;
  }

}

export interface FooBaz extends IEntity<string> { }
