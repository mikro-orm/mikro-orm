import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

@Entity({ tableName: 'book5' })
export class Book5 {

  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

  constructor(title: string) {
    this.title = title;
  }

}
