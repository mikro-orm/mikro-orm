import { Collection, Entity, IdentifiedReference, ManyToOne, OneToMany, OptionalProps, PrimaryKey, Property } from '@mikro-orm/core';
import { House } from './house.entity';
import { User } from './user.entity';

@Entity()
export class Project {

  [OptionalProps]?: 'createdAt';

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @ManyToOne({ entity: () => User, wrappedReference: true })
  owner!: IdentifiedReference<User>;

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
