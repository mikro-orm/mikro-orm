import { BaseEntity, Entity, Property } from '../../lib';

@Entity()
export class Test extends BaseEntity {

  @Property()
  name: string;

}
