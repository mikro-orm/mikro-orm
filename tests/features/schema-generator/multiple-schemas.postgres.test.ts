import { Entity, ManyToOne, MikroORM, OneToOne, PrimaryKey, Property } from '@mikro-orm/postgresql';

@Entity({ tableName: 'author', schema: 'n1' })
class Author0 {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @OneToOne(() => Author0, undefined, { nullable: true })
  mentor?: Author0;

}

@Entity({ tableName: 'book', schema: 'n2' })
class Book0 {

  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Author0)
  author!: Author0;

  @ManyToOne(() => Book0, { nullable: true })
  basedOn?: Book0;

}

@Entity({ tableName: 'book', schema: 'n2' })
class Book1 {

  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Author0, { nullable: true })
  author?: Author0;

  @ManyToOne(() => Book1)
  basedOn!: Book1;

}

describe('multiple connected schemas in postgres', () => {

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Author0, Book0],
      dbName: `mikro_orm_test_schemas`,
    });
    await orm.schema.ensureDatabase();
    await orm.schema.execute('drop schema if exists n1 cascade');
    await orm.schema.execute('drop schema if exists n2 cascade');
  });

  afterAll(async () => {
    await orm.close(true);
  });

  test('schema generator allows creating FKs across different schemas', async () => {
    const diff0 = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff0).toMatchSnapshot();
    await orm.schema.execute(diff0);

    orm.discoverEntity(Book1, 'Book0');
    const diff1 = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff1).toMatchSnapshot();
    await orm.schema.execute(diff1);

    const diff2 = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff2).toBe('');
  });

});
