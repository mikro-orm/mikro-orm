import { Entity, ManyToOne, MikroORM, PrimaryKey, Property } from '@mikro-orm/postgresql';

@Entity({ tableName: 'author' })
class Author0 {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

}

@Entity({ tableName: 'author' })
class Author1 {

  @PrimaryKey({ type: 'uuid' })
  id!: string;

  @Property()
  name!: string;

}

@Entity({ tableName: 'book' })
class Book0 {

  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Author0)
  author!: Author0;

  @ManyToOne(() => Book0, { nullable: true })
  basedOn?: Book0;

}

@Entity({ tableName: 'book' })
class Book1 {

  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Author1)
  author!: Author1;

  @ManyToOne(() => Book1, { nullable: true })
  basedOn?: Book1;

}

test('changing PK/FK type from int to uuid', async () => {
  const orm = await MikroORM.init({
    entities: [Author0, Book0],
    dbName: `mikro_orm_test_pk_fk_diffing`,
  });
  await orm.schema.ensureDatabase();
  await orm.schema.execute('drop table if exists author cascade');
  await orm.schema.execute('drop table if exists book cascade');
  await orm.schema.createSchema();

  orm.discoverEntity([Author1, Book1], ['Author0', 'Book0']);
  const diff1 = await orm.schema.getUpdateSchemaSQL({ wrap: false });
  expect(diff1).toMatchSnapshot();
  await orm.schema.execute(diff1);

  await orm.close(true);
});
