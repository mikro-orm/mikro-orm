import {
  Entity,
  Property,
  PrimaryKey,
  Index,
  Unique,
} from '@mikro-orm/core';

@Entity({ tableName: 'author', schema: '*' })
@Index({ name: 'custom_idx_on_name', expression: (table, columns) => `create index "custom_idx_on_name" on "${table.schema}"."${table.name}" ("${columns.name}")` })
@Unique({ name: 'custom_unique_on_email', expression: (table, columns) => `alter table ${table.quoted} add constraint "email_unique" unique ("${columns.email}")` })
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
