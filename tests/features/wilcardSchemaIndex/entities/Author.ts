import {
  Entity,
  Property,
  PrimaryKey,
  Index,
  Unique,
} from '@mikro-orm/core';

@Entity({ tableName: 'author', schema: '*' })
@Index({ name: 'custom_idx_on_name', expression: (schema?: string) => `create index "custom_idx_on_name" on "${schema}"."author" ("name")` })
@Unique({ name: 'custom_unique_on_email', expression: (schema?: string) => `alter table "${schema}"."author" add constraint "email_unique" unique ("email")` })
export class Author {

  @PrimaryKey()
  id!: number;

  @Property()
  name: string;

  @Property()
  email: string;

  constructor(name: string, email: string) {
    this.name = name;
    this.email = email;
  }

}
