import {
  BigIntType,
  Entity,
  MikroORM,
  PrimaryKey,
  Property,
} from '@mikro-orm/sqlite';
import { mockLogger } from '../helpers';
export class NativeBigIntType extends BigIntType {

  convertToJSValue(value: any): any {
    if (!value) {
      return value;
    }

    return BigInt(value);
  }

}

@Entity()
export class Author {

  @PrimaryKey({ type: NativeBigIntType, comment: 'PK' })
  id!: bigint;

  @Property({ nullable: true })
  name?: string;

  @Property({ persist: false })
  get nickname(): string {
    return this.name ?? '~';
  }

  @Property({ persist: false })
  foo?: string = '123';

}

describe('GH issue 1626', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Author],
      dbName: ':memory:',
    });
    await orm.schema.createSchema();
  });

  afterAll(() => orm.close(true));

  test(`queries with custom type PK (native bigint)`, async () => {
    const mock = mockLogger(orm, ['query']);

    const author = new Author();
    await orm.em.persistAndFlush(author);

    author.name = 'A';
    await orm.em.flush();

    await orm.em.removeAndFlush(author);

    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch('insert into `author` (`id`) select null as `id` returning `id`');
    expect(mock.mock.calls[2][0]).toMatch('commit');
    expect(mock.mock.calls[3][0]).toMatch('begin');
    expect(mock.mock.calls[4][0]).toMatch('update `author` set `name` = ? where `id` = ?');
    expect(mock.mock.calls[5][0]).toMatch('commit');
    expect(mock.mock.calls[6][0]).toMatch('begin');
    expect(mock.mock.calls[7][0]).toMatch('delete from `author` where `id` in (?)');
    expect(mock.mock.calls[8][0]).toMatch('commit');
    expect(mock.mock.calls.length).toBe(9);
  });

  test(`queries for multiple entities with custom type PK (native bigint)`, async () => {
    const mock = mockLogger(orm, ['query']);

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
