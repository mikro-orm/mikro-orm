import { Collection, Ref, OptionalProps } from '@mikro-orm/core';
import { Entity, ManyToOne, OneToMany, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { House } from './house.entity.js';
import { User } from './user.entity.js';

@Entity()
export class Project {
  [OptionalProps]?: 'createdAt';

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @ManyToOne({ entity: () => User, ref: true })
  owner!: Ref<User>;

  @Property()
  worth!: number;

  @OneToMany(() => House, house => house.project)
  houses = new Collection<House>(this);

  @Property()
  createdAt: Date = new Date();

  constructor(name: string) {
    this.name = name;
  }
}
