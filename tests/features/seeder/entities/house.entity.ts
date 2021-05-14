import { Entity, ManyToOne, PrimaryKey, Property } from '@mikro-orm/core';
import { Project } from './project.entity';

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
