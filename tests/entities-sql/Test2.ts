import { Entity, IEntity, PrimaryKey, Property } from '../../lib';

@Entity()
export class Test2 {

  @PrimaryKey()
  id: number;

  @Property({ nullable: true })
  name: string;

  static create(name: string) {
    const t = new Test2();
    t.name = name;

    return t;
  }

}

export interface Test2 extends IEntity<number> { }
