import { Entity, ManyToOne, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { Project } from './project.entity.js';

@Entity()
export class House {

  @PrimaryKey()
  id!: number;

  @Property()
  address!: string;

  @Property()
  bought = false;

  @ManyToOne(() => Project)
  project!: Project;

  @Property()
  createdAt: Date = new Date();

}
