import {Entity, Property, Collection, OneToMany} from '@mikro-orm/core';
import {BaseIdEntity, BaseIdEntityConstructor} from './BaseIdEntity';
import {Event} from './Event';

interface SiteConstructor extends BaseIdEntityConstructor {
  name: string;
}

@Entity()
export class Site extends BaseIdEntity {
  @Property()
  name: string;

  @OneToMany(() => Event, event => event.site)
  events: Collection<Event> = new Collection<Event>(this);

  constructor({id, createdAt, name}: SiteConstructor) {
    super({id, createdAt});
    this.name = name;
  }
}
