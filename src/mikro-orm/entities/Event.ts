import {
  Entity,
  ManyToMany,
  Collection,
  ManyToOne,
  IdentifiedReference,
  Reference,
  Property,
} from '@mikro-orm/core';
import {BaseIdEntity, BaseIdEntityConstructor} from './BaseIdEntity';
import {User} from './User';
import {Category} from './Category';
import {Site} from './Site';

interface EventConstructor extends BaseIdEntityConstructor {
  name: string;
  creator: User;
  category: Category;
  site: Site;
  partecipants: User[];
}

@Entity()
export class Event extends BaseIdEntity {
  @Property()
  name: string;

  @ManyToOne()
  creator: IdentifiedReference<User>;

  @ManyToOne()
  category: IdentifiedReference<Category>;

  @ManyToOne()
  site: IdentifiedReference<Site>;

  @ManyToMany()
  partecipants: Collection<User> = new Collection<User>(this);

  constructor({
    id,
    name,
    createdAt,
    creator,
    category,
    site,
    partecipants,
  }: EventConstructor) {
    super({id, createdAt});
    this.name = name;
    this.creator = Reference.create(creator);
    this.category = Reference.create(category);
    this.site = Reference.create(site);
    this.partecipants.add(...partecipants);
  }
}
