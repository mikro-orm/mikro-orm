import {Entity, Property, OneToMany, Collection} from '@mikro-orm/core';
import {BaseIdEntity, BaseIdEntityConstructor} from './BaseIdEntity';
import {Event} from './Event';

interface CategoryConstructor extends BaseIdEntityConstructor {
  name: string;
}

@Entity()
export class Category extends BaseIdEntity {
  @Property()
  name: string;

  @OneToMany(() => Event, event => event.category)
  events: Collection<Event> = new Collection<Event>(this);

  constructor({id, createdAt, name}: CategoryConstructor) {
    super({id, createdAt});
    this.name = name;
  }
}
