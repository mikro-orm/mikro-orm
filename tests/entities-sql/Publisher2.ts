import { Collection, Entity, Enum, ManyToMany, OneToMany, Property } from '../../lib';
import { Book2 } from './Book2';
import { Test2 } from './Test2';
import { BaseEntity2 } from './BaseEntity2';

@Entity()
export class Publisher2 extends BaseEntity2 {

  @Property()
  name: string;

  @OneToMany({ mappedBy: 'publisher' })
  books!: Collection<Book2>;

  @ManyToMany({ fixedOrder: true })
  tests!: Collection<Test2>;

  @Enum()
  type: PublisherType = PublisherType.LOCAL;

  @Enum()
  enum1?: Enum1;

  @Enum()
  enum2?: Enum2;

  @Enum({ items: [1, 2, 3] })
  enum3?: any;

  @Enum({ items: ['a', 'b', 'c'] })
  enum4?: any;

  constructor(name: string = 'asd', type: PublisherType = PublisherType.LOCAL) {
    super();
    this.name = name;
    this.type = type;
  }

}

export enum PublisherType {
  LOCAL = 'local',
  GLOBAL = 'global',
}

export const enum Enum1 {
  Value1,
  Value2,
}

export enum Enum2 {
  PROP1 = 1,
  PROP2 = 2,
}
