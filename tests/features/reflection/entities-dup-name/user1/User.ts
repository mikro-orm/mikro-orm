import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';

@Entity({ tableName: 'user1' })
export class User {
  @PrimaryKey()
  id!: number;

  @Property()
  email!: string;
}
