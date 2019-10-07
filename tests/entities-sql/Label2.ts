import { Entity, IEntity, PrimaryKey, Property } from '../../lib';
import { v4 } from 'uuid';

@Entity()
export class Label2 {

  @PrimaryKey({ type: 'uuid' })
  uuid: string = v4();

  @Property()
  name: string;

  constructor(name: string) {
    this.name = name;
  }

}

export interface Label2 extends IEntity<string> { }
