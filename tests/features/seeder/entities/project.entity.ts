import { Collection, Entity, OneToMany, PrimaryKey, Property } from '@mikro-orm/core';
import { House } from './house.entity';

@Entity()
export class Project {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Property()
  owner!: string;

  @Property()
  worth!: number;

  @OneToMany(() => House, house => house.project)
  houses = new Collection<House>(this);

  @Property()
  createdAt: Date = new Date();

}
