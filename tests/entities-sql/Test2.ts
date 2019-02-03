import { Entity, PrimaryKey, Property } from '../../lib';
import { BaseEntity2 } from './BaseEntity2';

@Entity()
export class Test2 extends BaseEntity2 {

  @PrimaryKey()
  id: number;

  @Property()
  name: string;

  static create(name: string) {
    const t = new Test2();
    t.name = name;

    return t;
  }

}
