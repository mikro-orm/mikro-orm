import {
  BigIntType,
  Entity,
  Logger,
  MikroORM,
  PrimaryKey,
  Property,
} from '@mikro-orm/core';
import { SqliteDriver } from '@mikro-orm/sqlite';
export class NativeBigIntType extends BigIntType {

  convertToJSValue(value: any): any {
    if (!value) {
      return value;
    }

    /* eslint-env es2020 */
    return BigInt(value);
  }

}

@Entity()
export class Author {

  @PrimaryKey({ type: NativeBigIntType, comment: 'PK' })
  id!: bigint;

  @Property({ nullable: true })
  name?: string;

}

describe('GH issue 1626', () => {
  let orm: MikroORM<SqliteDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Author],
      dbName: ':memory:',
      type: 'sqlite',
    });
    await orm.getSchemaGenerator().createSchema();
  });

  afterAll(() => orm.close(true));

  test(`queries with custom type PK (native bigint)`, async () => {
    const mock = jest.fn();
    const logger = new Logger(mock, ['query']);
    Object.assign(orm.config, { logger });

    const author = new Author();
    await orm.em.persistAndFlush(author);

    author.name = 'A';
    await orm.em.flush();

    await orm.em.removeAndFlush(author);

    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch(
      'insert into `author` default values',
    );
    expect(mock.mock.calls[2][0]).toMatch('commit');
    expect(mock.mock.calls[3][0]).toMatch('begin');
    expect(mock.mock.calls[4][0]).toMatch(
      'update `author` set `name` = ? where `id` = ?',
    );
    expect(mock.mock.calls[5][0]).toMatch('commit');
    expect(mock.mock.calls[6][0]).toMatch('begin');
    expect(mock.mock.calls[7][0]).toMatch(
      'delete from `author` where `id` in (?)',
    );
    expect(mock.mock.calls[8][0]).toMatch('commit');
    expect(mock.mock.calls.length).toBe(9);
  });

  test(`queries for multiple entities with custom type PK (native bigint)`, async () => {
    const mock = jest.fn();
    const logger = new Logger(mock, ['query']);
    Object.assign(orm.config, { logger });

    const authors = [new Author(), new Author()];
    authors[0].name = 'A';
    await orm.em.persistAndFlush(authors);

    authors[0].name = 'B';
    authors[1].name = 'C';
    await orm.em.flush();

    await orm.em.removeAndFlush(authors);

    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch(
      'insert into `author` (`name`) values (?), (?)',
    );
    expect(mock.mock.calls[2][0]).toMatch('commit');
    expect(mock.mock.calls[3][0]).toMatch('begin');
    expect(mock.mock.calls[4][0]).toMatch(
      'update `author` set `name` = case when (`id` = ?) then ? when (`id` = ?) then ? else `name` end where `id` in (?, ?)',
    );
    expect(mock.mock.calls[5][0]).toMatch('commit');
    expect(mock.mock.calls[6][0]).toMatch('begin');
    expect(mock.mock.calls[7][0]).toMatch(
      'delete from `author` where `id` in (?, ?)',
    );
    expect(mock.mock.calls[8][0]).toMatch('commit');
    expect(mock.mock.calls.length).toBe(9);
  });
});
