import { Entity, MikroORM, Opt, PrimaryKey, Property } from '@mikro-orm/mssql';

@Entity()
class User {

  @PrimaryKey()
  id!: number;

  @Property({ length: 50 })
  firstName!: string;

  @Property({ length: 50 })
  lastName!: string;

  @Property<User>({ length: 100, generated: cols => `(concat([${cols.firstName}],' ',[${cols.lastName}])) persisted` })
  fullName!: string & Opt;

  @Property<User>({ columnType: `as (concat([first_name],' ',[last_name])) persisted` })
  fullName2!: string & Opt;

}

@Entity({ tableName: 'user' })
class User1 {

  @PrimaryKey()
  id!: number;

  @Property({ length: 50 })
  firstName!: string;

  @Property({ length: 50 })
  lastName!: string;

  @Property<User>({ length: 100, generated: cols => `(concat([${cols.lastName}],' ',[${cols.firstName}])) persisted` })
  fullName!: string & Opt;

  @Property<User>({ columnType: `as (concat([first_name],' ',[last_name])) persisted` })
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
    generated: `(CASE WHEN (col1 IS NOT NULL) THEN 'one' WHEN (col2 IS NOT NULL) THEN 'two' WHEN (col3 IS NOT NULL) THEN 'three' ELSE 'four' END) PERSISTED`,
  })
  generated?: string;

  @Property({
    generated: `(CONCAT([col1], ' ', [col2])) PERSISTED`,
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
    generated: `(CASE WHEN (col1 IS NOT NULL) THEN 'one' WHEN (col2 IS NOT NULL) THEN 'two' WHEN (col3 IS NOT NULL) THEN 'three' ELSE 'four'::text END) PERSISTED`,
  })
  generated?: string;

  @Property({
    generated: `(CONCAT([col1], ' ', [col2])) PERSISTED`,
  })
  generated2?: string;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = MikroORM.initSync({
    entities: [User, Foo],
    dbName: 'generated-columns',
    password: 'Root.Root',
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
