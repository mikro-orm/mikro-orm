import { Entity, ManyToOne, MikroORM, PrimaryKey, Property } from '@mikro-orm/core';

@Entity({ tableName: 'author' })
export class Author0 {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

}

@Entity({ tableName: 'author' })
export class Author1 {

  @PrimaryKey()
  pk!: number;

  @Property()
  name!: string;

}

@Entity({ tableName: 'book' })
export class Book0 {

  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Author0)
  author1!: Author0;

  @ManyToOne(() => Author0)
  author2!: Author0;

  @ManyToOne(() => Book0, { nullable: true })
  basedOn?: Book0;

}

@Entity({ tableName: 'book' })
export class Book11 {

  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Author0)
  author1!: Author0;

}

@Entity({ tableName: 'book' })
export class Book1 {

  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Author1, { name: 'author1_id' })
  author1!: Author1;

  @ManyToOne(() => Author1, { name: 'author2_id' })
  author2!: Author1;

  @ManyToOne(() => Book1, { nullable: true })
  basedOn?: Book1;

}

@Entity({ tableName: 'book' })
export class Book2 {

  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Author1)
  author1!: Author1;

  @ManyToOne(() => Author1)
  author2!: Author1;

  @ManyToOne(() => Book2, { nullable: true })
  basedOn?: Book2;

}

@Entity({ tableName: 'book' })
export class Book3 {

  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Author1)
  author1!: Author1;

}

describe('dropping tables with  FKs in postgres', () => {

  test('schema generator removes stale FKs on target table dropping 1', async () => {
    const orm = await MikroORM.init({
      entities: [Author0, Book0],
      dbName: `mikro_orm_test_fk_diffing`,
      type: 'postgresql',
    });
    await orm.getSchemaGenerator().ensureDatabase();
    await orm.getSchemaGenerator().execute('drop table if exists author cascade');
    await orm.getSchemaGenerator().execute('drop table if exists book cascade');
    await orm.getSchemaGenerator().createSchema();

    orm.getMetadata().reset('Author0');
    orm.getMetadata().reset('Book0');
    await orm.discoverEntity([Author1, Book1]);
    const diff1 = await orm.getSchemaGenerator().getUpdateSchemaSQL({ wrap: false });
    expect(diff1).toMatchSnapshot();
    await orm.getSchemaGenerator().execute(diff1);

    orm.getMetadata().reset('Book1');
    await orm.discoverEntity(Book2);
    const diff2 = await orm.getSchemaGenerator().getUpdateSchemaSQL({ wrap: false });
    expect(diff2).toMatchSnapshot();
    await orm.getSchemaGenerator().execute(diff2);

    orm.getMetadata().reset('Book2');
    await orm.discoverEntity(Book3);
    orm.getMetadata().reset('Author0');
    const diff3 = await orm.getSchemaGenerator().getUpdateSchemaSQL({ wrap: false });
    expect(diff3).toMatchSnapshot();
    await orm.getSchemaGenerator().execute(diff3);

    await orm.close(true);
  });

  test('schema generator removes stale FKs on target table dropping 2', async () => {
    const orm = await MikroORM.init({
      entities: [Author0, Book0],
      dbName: `mikro_orm_test_fk_diffing`,
      type: 'postgresql',
    });
    await orm.getSchemaGenerator().ensureDatabase();
    await orm.getSchemaGenerator().execute('drop table if exists author cascade');
    await orm.getSchemaGenerator().execute('drop table if exists book cascade');
    await orm.getSchemaGenerator().createSchema();

    orm.getMetadata().reset('Book0');
    await orm.discoverEntity(Book11);
    orm.getMetadata().reset('Author0');
    const diff1 = await orm.getSchemaGenerator().getUpdateSchemaSQL({ wrap: false });
    expect(diff1).toMatchSnapshot();
    await orm.getSchemaGenerator().execute(diff1);

    await orm.close(true);
  });

});
