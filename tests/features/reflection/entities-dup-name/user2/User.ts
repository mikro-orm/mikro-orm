import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';

@Entity({ tableName: 'user2' })
export class User {
  @PrimaryKey()
  id!: number;

  @Property()
  username!: string;
}
