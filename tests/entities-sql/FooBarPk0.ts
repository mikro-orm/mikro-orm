import { Entity, ManyToOne, PrimaryKey, Property } from '../../lib';
import { BaseEntity22 } from './BaseEntity22';
import { FooBazPk0 } from './FooBazPk0';

@Entity()
export class FooBarPk0 extends BaseEntity22 {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @ManyToOne({ nullable: true })
  baz?: FooBazPk0;

  @Property({ version: true, length: 0 })
  version!: Date;

  static create(name: string) {
    const bar = new FooBarPk0();
    bar.name = name;

    return bar;
  }

}
