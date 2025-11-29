import { PrimaryKey } from '@mikro-orm/decorators/legacy';

export abstract class BaseEntity {

  @PrimaryKey()
  id!: number;

}
