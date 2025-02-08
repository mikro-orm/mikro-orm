import {
  DeferMode,
  Entity,
  ManyToOne,
  MikroORM,
  OneToOne,
  PrimaryKey,
  Property,
} from '@mikro-orm/postgresql';

@Entity({ tableName: 'author' })
class Author0 {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

}

@Entity({ tableName: 'author' })
class Author1 {

  @PrimaryKey()
  pk!: number;

  @Property()
  name!: string;

}

@Entity({ tableName: 'book' })
class Book0 {

  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Author0)
  author1!: Author0;

  @ManyToOne(() => Author0, { foreignKeyName: 'book_author2_id_custom_foreign_name' })
  author2!: Author0;

  @ManyToOne(() => Book0, { nullable: true })
  basedOn?: Book0;

}

@Entity({ tableName: 'book' })
class Book11 {

  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Author0)
  author1!: Author0;

}

@Entity({ tableName: 'book' })
class Book1 {

  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Author1, { name: 'author1_id' })
  author1!: Author1;

  @ManyToOne(() => Author1, { name: 'author2_id', foreignKeyName: 'book_author2_id_custom_foreign_name' })
  author2!: Author1;

  @ManyToOne(() => Book1, { nullable: true })
  basedOn?: Book1;

}

@Entity({ tableName: 'book' })
class Book2 {

  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Author1)
  author1!: Author1;

  @ManyToOne(() => Author1, { foreignKeyName: 'book_author2_id_custom_foreign_name' })
  author2!: Author1;

  @ManyToOne(() => Book2, { nullable: true })
  basedOn?: Book2;

}

@Entity({ tableName: 'book' })
class Book3 {

  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Author1)
  author1!: Author1;

}

@Entity({ tableName: 'book' })
class Book4 {

  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Author1)
  author1!: Author1;

  @OneToOne(() => Author1, { foreignKeyName: 'book_author2_id_custom_foreign_name' })
  author2!: Author1;

}

@Entity({ tableName: 'book' })
class Book41 {

  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Author1, { deferMode: DeferMode.INITIALLY_DEFERRED })
  author1!: Author1;

  @OneToOne(() => Author1, { deferMode: DeferMode.INITIALLY_DEFERRED })
  author2!: Author1;

}

@Entity({ tableName: 'book' })
class Book42 {

  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Author1, { deferMode: DeferMode.INITIALLY_IMMEDIATE })
  author1!: Author1;

  @OneToOne(() => Author1, { deferMode: DeferMode.INITIALLY_IMMEDIATE })
  author2!: Author1;

}

describe('dropping tables with FKs in postgres', () => {

  test('schema generator removes stale FKs on target table dropping 1', async () => {
    const orm = await MikroORM.init({
      entities: [Author0, Book0],
      dbName: `mikro_orm_test_fk_diffing`,
    });
    await orm.schema.ensureDatabase();
    await orm.schema.execute('drop table if exists author cascade');
    await orm.schema.execute('drop table if exists book cascade');
    await orm.schema.createSchema();

    orm.discoverEntity([Author1, Book1], ['Author0', 'Book0']);
    const diff1 = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff1).toMatchSnapshot();
    await orm.schema.execute(diff1);

    orm.discoverEntity(Book2, 'Book1');
    const diff2 = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff2).toMatchSnapshot();
    await orm.schema.execute(diff2);

    orm.discoverEntity(Book3, 'Book2');
    orm.getMetadata().reset('Author0');
    const diff3 = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff3).toMatchSnapshot();
    await orm.schema.execute(diff3);

    await orm.close(true);
  });

  test('schema generator removes stale FKs on target table dropping 2', async () => {
    const orm = await MikroORM.init({
      entities: [Author0, Book0],
      dbName: `mikro_orm_test_fk_diffing`,
    });
    await orm.schema.ensureDatabase();
    await orm.schema.execute('drop table if exists author cascade');
    await orm.schema.execute('drop table if exists book cascade');
    await orm.schema.createSchema();

    orm.discoverEntity(Book11, 'Book0');
    orm.getMetadata().reset('Author0');
    const diff1 = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff1).toMatchSnapshot();
    await orm.schema.execute(diff1);

    await orm.close(true);
  });

});

describe('updating tables with FKs in postgres', () => {

  test('schema generator updates foreign keys on deferrable change', async () => {
    const orm = await MikroORM.init({
      entities: [Author1, Book3],
      dbName: `mikro_orm_test_fk_diffing`,
    });
    await orm.schema.ensureDatabase();
    await orm.schema.execute('drop table if exists author cascade');
    await orm.schema.execute('drop table if exists book cascade');
    await orm.schema.createSchema();

    orm.discoverEntity(Book41, 'Book3');
    const diff1 = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff1).toMatchSnapshot();
    await orm.schema.execute(diff1);
    await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');

    orm.discoverEntity(Book42, 'Book41');
    const diff2 = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff2).toMatchSnapshot();
    await orm.schema.execute(diff2);
    await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');

    orm.discoverEntity(Book4, 'Book42');
    const diff3 = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff3).toMatchSnapshot();
    await orm.schema.execute(diff3);
    await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');

    await orm.close(true);
  });

});
