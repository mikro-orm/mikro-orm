import { Entity, MikroORM, PrimaryKey, Property, Type } from '@mikro-orm/sqlite';
import { Guid } from 'guid-typescript';
import { mockLogger } from '../helpers';

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

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Couch],
      dbName: ':memory:',
    });
    await orm.schema.createSchema();
  });

  afterAll(async () => {
    await orm.close(true);
  });

  test(`GH issue 1721`, async () => {
    const mock = mockLogger(orm);

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
    expect(mock.mock.calls[1][0]).toMatch("insert into `couch` (`id`, `user_id`, `name`) values ('aaaaaaaa-c65f-42b8-408a-034a6948448f', 'bbbbbbbb-c65f-42b8-408a-034a6948448f', 'n1')");
    expect(mock.mock.calls[2][0]).toMatch('commit');
    expect(mock.mock.calls[3][0]).toMatch("select `c0`.* from `couch` as `c0` where `c0`.`id` = 'aaaaaaaa-c65f-42b8-408a-034a6948448f' limit 1");
    expect(mock.mock.calls[4][0]).toMatch('begin');
    expect(mock.mock.calls[5][0]).toMatch("update `couch` set `name` = 'n2' where `id` = 'aaaaaaaa-c65f-42b8-408a-034a6948448f'");
    expect(mock.mock.calls[6][0]).toMatch('commit');
  });

});
