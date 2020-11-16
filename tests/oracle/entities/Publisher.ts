import { Collection, Entity, Enum, ManyToMany, OneToMany, Property } from '@mikro-orm/core';
import { Book } from './Book';
import { Test } from './Test';
import { BaseEntity } from './BaseEntity';

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
export class Publisher extends BaseEntity {

  @Property({ fieldName: 'name' })
  name: string;

  @OneToMany(() => Book, 'publisher', { joinColumn: 'book_uuid', inverseJoinColumn: 'publisher_id' })
  books!: Collection<Book>;

  @ManyToMany({ entity: () => Test, fixedOrder: true })
  tests!: Collection<Test>;

  @Enum(() => PublisherType)
  type = PublisherType.LOCAL;

  @Enum(() => PublisherType2)
  type2 = PublisherType2.LOCAL;

  @Enum({ nullable: true })
  enum1?: Enum1;

  @Enum({ type: 'Enum2', nullable: true })
  enum2?: Enum2;

  @Enum({ items: [1, 2, 3], nullable: true })
  enum3?: any;

  @Enum({ items: ['a', 'b', 'c'], nullable: true })
  enum4?: any;

  constructor(name = 'asd', type = PublisherType.LOCAL) {
    super();
    this.name = name;
    this.type = type;
  }

}
