import { Entity, Logger, MikroORM, PrimaryKey, Property, Type } from '@mikro-orm/core';
import { SqliteDriver } from '@mikro-orm/sqlite';
import { Guid } from 'guid-typescript';

export class GuidType extends Type<Guid | undefined, string | undefined> {

  convertToDatabaseValue(value: Guid | undefined): string | undefined {
    if (!value) {
      return value;
    }

    return value.toString();
  }

  convertToJSValue(value: string | undefined): Guid | undefined {
    if (!value) {
      return undefined;
    }

    return Guid.parse(value);
  }

  getColumnType(): string {
    return 'text';
  }

}

@Entity()
export class Couch {

  @PrimaryKey({ type: GuidType })
  id!: Guid;

  @Property({ type: GuidType })
  userId!: Guid;

  @Property()
  name!: string;

}

describe('GH issue 1721', () => {

  let orm: MikroORM<SqliteDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Couch],
      dbName: ':memory:',
      type: 'sqlite',
    });
    await orm.getSchemaGenerator().createSchema();
  });

  afterAll(async () => {
    await orm.close(true);
  });

  test(`GH issue 1721`, async () => {
    const mock = jest.fn();
    const logger = new Logger(mock, true);
    Object.assign(orm.config, { logger });

    const e = new Couch();
    e.id = Guid.parse('aaaaaaaa-c65f-42b8-408a-034a6948448f');
    e.userId = Guid.parse('bbbbbbbb-c65f-42b8-408a-034a6948448f');
    e.name = 'n1';
    await orm.em.fork().persistAndFlush(e);

    const e1 = await orm.em.findOneOrFail(Couch, e);
    e1.name = 'n2';
    await orm.em.flush();

    expect(mock.mock.calls).toHaveLength(7);
    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch("insert into `couch` (`id`, `name`, `user_id`) values ('aaaaaaaa-c65f-42b8-408a-034a6948448f', 'n1', 'bbbbbbbb-c65f-42b8-408a-034a6948448f')");
    expect(mock.mock.calls[2][0]).toMatch('commit');
    expect(mock.mock.calls[3][0]).toMatch("select `e0`.* from `couch` as `e0` where `e0`.`id` = 'aaaaaaaa-c65f-42b8-408a-034a6948448f' limit 1");
    expect(mock.mock.calls[4][0]).toMatch('begin');
    expect(mock.mock.calls[5][0]).toMatch("update `couch` set `name` = 'n2' where `id` = 'aaaaaaaa-c65f-42b8-408a-034a6948448f'");
    expect(mock.mock.calls[6][0]).toMatch('commit');
  });

});
