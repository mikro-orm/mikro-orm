import { BaseEntity, Entity, Property } from '../../lib';

@Entity()
export class Test extends BaseEntity {

  @Property()
  name: string;

  static create(name: string) {
    const t = new Test();
    t.name = name;

    return t;
  }

}
