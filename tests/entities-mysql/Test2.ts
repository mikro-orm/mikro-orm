import { BaseEntity, Entity, PrimaryKey, Property } from '../../lib';

@Entity()
export class Test2 extends BaseEntity {

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
