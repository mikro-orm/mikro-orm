import { Collection, Entity, Enum, EnumType, ManyToMany, OneToMany, OptionalProps, Property } from '@mikro-orm/core';
import { Book2 } from './Book2';
import { Test2 } from './Test2';
import { BaseEntity2 } from './BaseEntity2';

export enum PublisherType {
  LOCAL = 'local',
  GLOBAL = 'global',
}

export enum PublisherType2 {
  LOCAL = 'LOCAL',
  GLOBAL = 'GLOBAL',
}

export const enum Enum1 {
  Value1,
  Value2,
}

export enum Enum2 {
  PROP1 = 1,
  PROP2 = 2,
}

@Entity()
export class Publisher2 extends BaseEntity2 {

  [OptionalProps]?: 'type' | 'type2' | 'hookTest';

  @Property({ fieldName: 'name' })
  name: string;

  @OneToMany(() => Book2, 'publisher', { joinColumn: 'book_uuid', inverseJoinColumn: 'publisher_id' })
  books = new Collection<Book2>(this);

  @ManyToMany({ entity: () => Test2, pivotTable: 'publisher2_tests', fixedOrder: true })
  tests = new Collection<Test2>(this);

  @Enum(() => PublisherType)
  type = PublisherType.LOCAL;

  @Enum(() => PublisherType2)
  type2 = PublisherType2.LOCAL;

  @Enum({ nullable: true, type: EnumType })
  enum1?: Enum1;

  @Enum({ type: 'Enum2', nullable: true })
  enum2?: Enum2;

  @Enum({ items: [1, 2, 3], nullable: true })
  enum3?: any;

  @Enum({ items: ['a', 'b', 'c'], nullable: true })
  enum4?: any;

  @Enum({ items: ['a'], nullable: true })
  enum5?: any;

  constructor(name = 'asd', type = PublisherType.LOCAL) {
    super();
    this.name = name;
    this.type = type;
  }

}
