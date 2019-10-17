import { Entity, IdEntity, OneToOne, PrimaryKey, Property } from '../../lib';
import { FooBar2 } from './FooBar2';

@Entity()
export class FooBaz2 implements IdEntity<FooBaz2> {

  @PrimaryKey()
  id!: number;

  @Property()
  name: string;

  @OneToOne({ mappedBy: 'baz' })
  bar?: FooBar2;

  @Property({ version: true })
  version!: Date;

  constructor(name: string) {
    this.name = name;
  }

}
