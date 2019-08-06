import { ObjectID } from 'mongodb';
import { Entity, IEntity, OneToOne, PrimaryKey, Property } from '../../../lib';
import { FooBaz } from './FooBaz';

@Entity()
export class FooBar {
  @PrimaryKey()
  _id: ObjectID;

  @Property()
  name: string;

  @OneToOne({ inversedBy: 'bar', orphanRemoval: true })
  baz: FooBaz | null;

  @OneToOne({ owner: true })
  fooBar: FooBar;

  static create(name: string) {
    const bar = new FooBar();
    bar.name = name;

    return bar;
  }
}

export interface FooBar extends IEntity<string> {}
