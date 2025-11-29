import { Collection } from '@mikro-orm/core';
import { Entity, OneToMany, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import type { BookWpI } from './index.js';

@Entity()
export class AuthorWpI {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Property()
  email!: string;

  @Property()
  age?: number;

  @OneToMany({ mappedBy: 'author' })
  books = new Collection<BookWpI>(this);

}
