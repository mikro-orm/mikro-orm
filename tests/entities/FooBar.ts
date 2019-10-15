import { ObjectId } from 'mongodb';
import { Entity, MongoEntity, OneToOne, PrimaryKey, Property } from '../../lib';
import { FooBaz } from './FooBaz';
import { SerializedPrimaryKey } from '../../lib/decorators';

@Entity()
export class FooBar implements MongoEntity<FooBar> {

  @PrimaryKey()
  _id!: ObjectId;

  @SerializedPrimaryKey()
  id!: string;

  @Property()
  name!: string;

  @OneToOne({ eager: true, orphanRemoval: true })
  baz!: FooBaz | null;

  @OneToOne()
  fooBar!: FooBar;

  static create(name: string) {
    const bar = new FooBar();
    bar.name = name;

    return bar;
  }

}
