import { Entity, IEntity, PrimaryKey, Property } from '../../lib';

@Entity()
export class FooBaz2 {

  @PrimaryKey()
  id: number;

  @Property()
  name: string;

}

export interface FooBaz2 extends IEntity<number> { }
