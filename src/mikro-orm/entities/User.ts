import {
  Entity,
  Property,
  Enum,
  OneToMany,
  Collection,
  ManyToMany,
} from '@mikro-orm/core';
import {BaseIdEntity, BaseIdEntityConstructor} from './BaseIdEntity';
import {Event} from './Event';

export enum Sex {
  MALE = 0,
  FEMALE = 1,
}

interface UserContructor extends BaseIdEntityConstructor {
  name: string;
  sex: Sex;
}

@Entity()
export class User extends BaseIdEntity {
  @Property()
  name: string;

  @Enum()
  sex: Sex;

  @OneToMany(() => Event, event => event.creator)
  createdEvents: Collection<Event> = new Collection<Event>(this);

  @ManyToMany(() => Event, event => event.partecipants)
  partecipatedEvents: Collection<Event> = new Collection<Event>(this);

  constructor({id, createdAt, name, sex}: UserContructor) {
    super({id, createdAt});
    this.name = name;
    this.sex = sex;
  }
}
