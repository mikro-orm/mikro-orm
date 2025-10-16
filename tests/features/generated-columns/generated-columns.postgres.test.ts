import { Entity, MikroORM, Opt, PrimaryKey, Property } from '@mikro-orm/postgresql';

@Entity()
class User {

  @PrimaryKey({ generated: 'by default as identity' })
  id!: number;

  @Property({ length: 50 })
  firstName!: string;

  @Property({ length: 50 })
  lastName!: string;

  @Property({ length: 100, generated: cols => `(${cols.firstName} || ' ' || ${cols.lastName}) stored` })
  fullName!: string & Opt;

  @Property({ columnType: `varchar(100) generated always as (first_name || ' ' || last_name) stored` })
  fullName2!: string & Opt;

}

@Entity({ tableName: 'user' })
class User1 {

  @PrimaryKey({ generated: 'by default as identity' })
  id!: number;

  @Property({ length: 50 })
  firstName!: string;

  @Property({ length: 50 })
  lastName!: string;

  @Property({ length: 100, generated: cols => `(${cols.lastName} || ' ' || ${cols.firstName}) stored` })
  fullName!: string & Opt;

  @Property({ columnType: `varchar(100) generated always as (first_name || ' ' || last_name) stored` })
  fullName2!: string & Opt;

}

@Entity()
class Foo {

  @PrimaryKey()
  id!: number;

  @Property()
  col1!: string;

  @Property()
  col2!: string;

  @Property({ unique: true })
  col3!: string;

  @Property({
    generated: `(CASE WHEN (col1 IS NOT NULL) THEN 'one'::text WHEN (col2 IS NOT NULL) THEN 'two'::text WHEN (col3 IS NOT NULL) THEN 'three'::text ELSE 'four'::text END) STORED`,
    type: 'text',
    nullable: true,
  })
  generated?: string;

  @Property({
    generated: `(col1 || ' ' || col2) STORED`,
    type: 'text',
    nullable: true,
  })
  generated2?: string;

}

@Entity({ tableName: 'foo' })
class Foo1 {

  @PrimaryKey()
  id!: number;

  @Property()
  col1!: string;

  @Property()
  col2!: string;

  @Property({ unique: true })
  col3!: string;

  @Property({
    generated: `(CASE WHEN (col1 IS NOT NULL) THEN 'one'::text WHEN (col2 IS NOT NULL) THEN 'two'::text WHEN (col3 IS NOT NULL) THEN 'three'::text ELSE 'four'::text END) STORED`,
    type: 'text',
    nullable: true,
  })
  generated?: string;

  @Property({
    generated: `(col1 || ' ' || col2) STORED`,
    type: 'text',
    nullable: true,
  })
  generated2?: string;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [User, Foo],
    dbName: 'generated-columns',
  });

  await orm.schema.refreshDatabase();
});

afterAll(() => orm.close(true));

test('validation', async () => {
  const user = orm.em.create(User, {
    id: 1,
    firstName: 'First',
    lastName: 'Last',
  });
  await orm.em.flush();

  expect(user).toEqual({
    id: 1,
    firstName: 'First',
    lastName: 'Last',
    fullName: 'First Last',
    fullName2: 'First Last',
  });

  user.lastName = 'Changed';
  user.fullName = 'Changed'; // will be ignored
  await orm.em.flush();

  expect(user).toEqual({
    id: 1,
    firstName: 'First',
    lastName: 'Changed',
    fullName: 'First Changed',
    fullName2: 'First Changed',
  });

  const u = await orm.em.fork().findOneOrFail(User, 1);

  expect(u).toEqual({
    id: 1,
    firstName: 'First',
    lastName: 'Changed',
    fullName: 'First Changed',
    fullName2: 'First Changed',
  });
});

test('schema', async () => {
  const createSQL = await orm.schema.getCreateSchemaSQL();
  expect(createSQL).toMatchSnapshot();
  const updateSQL = await orm.schema.getUpdateSchemaSQL();
  expect(updateSQL).toBe('');

  orm.discoverEntity([User1, Foo1], ['User', 'Foo']);
  const diff1 = await orm.schema.getUpdateSchemaSQL({ wrap: false });
  expect(diff1).toMatchSnapshot();
  await orm.schema.execute(diff1);

  const updateSQL2 = await orm.schema.getUpdateSchemaSQL();
  expect(updateSQL2).toBe('');
});
