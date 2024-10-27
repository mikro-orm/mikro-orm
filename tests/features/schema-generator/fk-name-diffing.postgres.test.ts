import { Entity, ManyToOne, MikroORM, PrimaryKey, Property } from '@mikro-orm/postgresql';

@Entity()
class Book {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

}

@Entity()
class User {

  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Book)
  book!: Book;

}

test('changing FK names create schema diff', async () => {
  const orm = await MikroORM.init({
    entities: [User],
    dbName: `mikro_orm_test_fk_diffing2`,
  });
  await orm.schema.refreshDatabase();

  orm.config.getNamingStrategy().indexName = (tableName: string, columns: string[], type: 'primary' | 'foreign' | 'unique' | 'index' | 'sequence' | 'check') => {
    return `${tableName}_${columns.join('_')}_new_fk_name`;
  };
  const diff1 = await orm.schema.getUpdateSchemaSQL();
  expect(diff1).toMatchSnapshot();
  await orm.schema.execute(diff1);

  await orm.close(true);
});
