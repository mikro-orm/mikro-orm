import { DeferMode, Entity, ManyToOne, MikroORM, PrimaryKey, Property } from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';

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

@Entity({ tableName: 'book' })
export class Book4 {

  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Author1)
  author1!: Author1;

}

@Entity({ tableName: 'book' })
export class Book41 {

  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Author1, { deferMode: DeferMode.INITIALLY_DEFERRED })
  author1!: Author1;

}

@Entity({ tableName: 'book' })
export class Book42 {

  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Author1, { deferMode: DeferMode.INITIALLY_IMMEDIATE })
  author1!: Author1;

}

describe('dropping tables with FKs in postgres', () => {

  test('schema generator removes stale FKs on target table dropping 1', async () => {
    const orm = await MikroORM.init({
      entities: [Author0, Book0],
      dbName: `mikro_orm_test_fk_diffing`,
      driver: PostgreSqlDriver,
    });
    await orm.schema.ensureDatabase();
    await orm.schema.execute('drop table if exists author cascade');
    await orm.schema.execute('drop table if exists book cascade');
    await orm.schema.createSchema();

    orm.getMetadata().reset('Author0');
    orm.getMetadata().reset('Book0');
    await orm.discoverEntity([Author1, Book1]);
    const diff1 = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff1).toMatchSnapshot();
    await orm.schema.execute(diff1);

    orm.getMetadata().reset('Book1');
    await orm.discoverEntity(Book2);
    const diff2 = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff2).toMatchSnapshot();
    await orm.schema.execute(diff2);

    orm.getMetadata().reset('Book2');
    await orm.discoverEntity(Book3);
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
      driver: PostgreSqlDriver,
    });
    await orm.schema.ensureDatabase();
    await orm.schema.execute('drop table if exists author cascade');
    await orm.schema.execute('drop table if exists book cascade');
    await orm.schema.createSchema();

    orm.getMetadata().reset('Book0');
    await orm.discoverEntity(Book11);
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
      driver: PostgreSqlDriver,
    });
    await orm.schema.ensureDatabase();
    await orm.schema.execute('drop table if exists author cascade');
    await orm.schema.execute('drop table if exists book cascade');
    await orm.schema.createSchema();

    orm.getMetadata().reset('Book3');
    orm.discoverEntity([Book41]);
    const diff1 = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff1).toMatchSnapshot();
    await orm.schema.execute(diff1);
    await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');

    orm.getMetadata().reset('Book41');
    orm.discoverEntity([Book42]);
    const diff2 = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff2).toMatchSnapshot();
    await orm.schema.execute(diff2);
    await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');

    orm.getMetadata().reset('Book42');
    orm.discoverEntity([Book4]);
    const diff3 = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff3).toMatchSnapshot();
    await orm.schema.execute(diff3);
    await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');

    await orm.close(true);
  });

});
