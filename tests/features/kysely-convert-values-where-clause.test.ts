import { defineEntity, p, Type } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/sqlite';
import { sql } from 'kysely';

class Email {
  constructor(readonly value: string) {}

  toString(): string {
    return this.value;
  }
}

class EmailType extends Type<Email, string> {
  override convertToDatabaseValue(value: Email | string): string {
    return value instanceof Email ? value.value : value;
  }

  override convertToJSValue(value: string): Email {
    return new Email(value);
  }

  override getColumnType(): string {
    return 'varchar(255)';
  }
}

class HexEncodedType extends Type<string | null, string | null> {
  override convertToJSValueSQL(key: string): string {
    return `hex(${key})`;
  }

  override convertToJSValue(value: string | null): string | null {
    return value == null ? value : Buffer.from(value, 'hex').toString('utf8');
  }

  override convertToDatabaseValueSQL(key: string): string {
    return `unhex(${key})`;
  }

  override convertToDatabaseValue(value: string | null): string | null {
    return value == null ? value : Buffer.from(value, 'utf8').toString('hex');
  }
}

const User = defineEntity({
  name: 'User',
  properties: {
    id: p.integer().primary().autoincrement(),
    name: p.string(),
    email: p.type(EmailType),
    secret: p.type(HexEncodedType).nullable(),
  },
});

interface UserTable {
  id: number;
  name: string;
  email: Email;
  secret: string | null;
}

let orm: MikroORM;

const options = {
  tableNamingStrategy: 'entity',
  convertValues: true,
} as const;

function getKysely() {
  return orm.em.getKysely<{ User: UserTable }>(options);
}

beforeAll(async () => {
  orm = new MikroORM({
    entities: [User],
    dbName: ':memory:',
  });
  await orm.schema.refresh();

  await getKysely()
    .insertInto('User')
    .values([
      { id: 1, name: 'Foo', email: new Email('foo@example.com'), secret: 'foo secret' },
      { id: 2, name: 'Bar', email: new Email('bar@example.com'), secret: 'bar secret' },
    ])
    .execute();
});

afterAll(async () => {
  await orm.close(true);
});

test('custom type values in where clause are converted to database values', async () => {
  const user = await getKysely()
    .selectFrom('User')
    .selectAll()
    .where('email', '=', new Email('foo@example.com'))
    .executeTakeFirstOrThrow();

  expect(user.name).toBe('Foo');
  expect(user.email).toBeInstanceOf(Email);
  expect(user.email.value).toBe('foo@example.com');
});

test('custom type values in `in` list are converted to database values', async () => {
  const users = await getKysely()
    .selectFrom('User')
    .selectAll()
    .where('email', 'in', [new Email('foo@example.com'), new Email('bar@example.com')])
    .orderBy('id')
    .execute();

  expect(users.map(u => u.name)).toEqual(['Foo', 'Bar']);
});

test('custom type values in update/delete where clauses are converted', async () => {
  await getKysely()
    .insertInto('User')
    .values([{ id: 3, name: 'Baz', email: new Email('baz@example.com'), secret: null }])
    .execute();

  await getKysely()
    .updateTable('User')
    .set({ name: 'Baz 2' })
    .where('email', '=', new Email('baz@example.com'))
    .execute();

  const user = await getKysely()
    .selectFrom('User')
    .select(['name'])
    .where('email', '=', new Email('baz@example.com'))
    .executeTakeFirstOrThrow();
  expect(user.name).toBe('Baz 2');

  await getKysely().deleteFrom('User').where('email', '=', new Email('baz@example.com')).execute();

  const count = await getKysely()
    .selectFrom('User')
    .select(eb => eb.fn.countAll().as('count'))
    .executeTakeFirstOrThrow();
  expect(Number(count.count)).toBe(2);
});

test('where clause values on aliased tables are converted', async () => {
  const user = await getKysely()
    .selectFrom('User as u')
    .selectAll()
    .where('u.email', '=', new Email('foo@example.com'))
    .executeTakeFirstOrThrow();

  expect(user.name).toBe('Foo');
});

test('raw root query with embedded comparison does not crash', async () => {
  const res = await sql`select * from user where ${sql.ref('email')} = ${'nobody@example.com'}`.execute(getKysely());
  expect(res.rows).toEqual([]);
});

test('where clause values are wrapped with convertToDatabaseValueSQL', async () => {
  const query = getKysely().selectFrom('User').select(['name']).where('secret', '=', 'foo secret');

  expect(query.compile().sql).toBe('select "name" from "user" where "secret" = unhex(?)');

  const user = await query.executeTakeFirstOrThrow();
  expect(user.name).toBe('Foo');
});
