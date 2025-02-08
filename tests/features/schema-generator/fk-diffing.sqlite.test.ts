import { MikroORM, Entity, ManyToOne, PrimaryKey, Property, OneToOne, DeferMode } from '@mikro-orm/sqlite';

@Entity()
class Door {

  @PrimaryKey({ autoincrement: false })
  id!: number;

  @Property()
  label!: string;

  @Property({ default: true })
  isEnabled!: boolean;

  @Property()
  state!: 'open' | 'closed';

}

@Entity({ tableName: 'sequence' })
class Sequence0 {

  @PrimaryKey()
  id!: number;

  @Property()
  index!: number;

  @Property()
  action!: 'on' | 'off' | 'low' | 'high';

  @Property()
  target!:
    | 'relay1'
    | 'relay2'
    | 'relay3'
    | 'digitalOutput1'
    | 'digitalOutput2'
    | 'digitalOutput3';

  @Property()
  duration!: number;

  @ManyToOne(() => Door)
  door!: Door;

}

@Entity({ tableName: 'sequence' })
class Sequence1 {

  @PrimaryKey()
  id!: number;

  @Property()
  index!: number;

  @Property()
  action!: 'on' | 'off' | 'low' | 'high';

  @Property({ nullable: true })
  anotherProperty?: string;

  @Property()
  target!:
    | 'relay1'
    | 'relay2'
    | 'relay3'
    | 'digitalOutput1'
    | 'digitalOutput2'
    | 'digitalOutput3';

  @Property()
  duration!: number;

  @ManyToOne(() => Door)
  door!: Door;

}

describe('dropping tables with FKs in postgres', () => {

  test('schema generator removes stale FKs on target table dropping 1', async () => {
    const orm = await MikroORM.init({
      entities: [Sequence0, Door],
      dbName: `:memory:`,
      metadataCache: { enabled: false },
    });
    await orm.schema.refreshDatabase();

    orm.discoverEntity(Sequence1, 'Sequence0');
    const diff1 = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff1).toMatchSnapshot();
    await orm.schema.execute(diff1);

    await orm.close(true);
  });

});

@Entity({ tableName: 'author' })
class Author1 {

  @PrimaryKey()
  pk!: number;

  @Property()
  name!: string;

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

  @OneToOne(() => Author1)
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

describe('updating tables with FKs in sqlite', () => {

  test('schema generator updates foreign keys on deferrable change', async () => {
    const orm = await MikroORM.init({
      entities: [Author1, Book3],
      dbName: ':memory:',
    });
    await orm.schema.ensureDatabase();
    await orm.schema.execute('drop table if exists author');
    await orm.schema.execute('drop table if exists book');
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
