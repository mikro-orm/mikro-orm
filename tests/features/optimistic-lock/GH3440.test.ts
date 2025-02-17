import { Entity, PrimaryKey, Property, Type, ValidationError } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/mysql';
import { mockLogger } from '../../helpers.js';

export function toBinaryUuid(uuid: string): Buffer {
  const buf = Buffer.from(uuid.replace(/-/g, ''), 'hex');
  return Buffer.concat([
    buf.slice(0, 4),
    buf.slice(4, 6),
    buf.slice(6, 8),
    buf.slice(8, 16),
  ]);
}

export function fromBinaryUuid(uuid: Buffer): string {
  return [
    uuid.toString('hex', 0, 2),
    uuid.toString('hex', 2, 4),
    uuid.toString('hex', 4, 8),
    uuid.toString('hex', 8, 10),
    uuid.toString('hex', 10, 16),
  ].join('-');
}

export class Guid extends Type<string, Buffer> {

  override convertToDatabaseValue(value: string): Buffer {
    if (typeof value !== 'string' || value.replace(/-/g, '').length !== 32) {
      throw ValidationError.invalidType(Guid, value, 'JS');
    }

    return toBinaryUuid(value);
  }

  override convertToJSValue(value: Buffer): string {
    return fromBinaryUuid(value);
  }

  override getColumnType() {
    return `BINARY(16)`;
  }

}

@Entity()
export class Couch {

  @PrimaryKey({ type: Guid })
  id!: string;

  @Property({ type: Guid })
  userId!: string;

  @Property()
  name!: string;

  @Property({ version: true })
  version!: number;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Couch],
    dbName: 'mikro_orm_test_3440',
    port: 3308,
  });
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

test(`GH issue 3440`, async () => {
  const mock = mockLogger(orm);

  const e = new Couch();
  e.id = 'aaaa-aaaa-c65f42b8-408a-034a6948448f';
  e.userId = 'bbbb-bbbb-c65f42b8-408a-034a6948448f';
  e.name = 'n1';
  await orm.em.fork().persistAndFlush(e);

  const e1 = await orm.em.findOneOrFail(Couch, e);
  e1.name = 'n2';
  await orm.em.flush();

  expect(mock.mock.calls).toHaveLength(9);
  expect(mock.mock.calls[0][0]).toMatch('begin');
  expect(mock.mock.calls[1][0]).toMatch("insert into `couch` (`id`, `user_id`, `name`) values (X'aaaaaaaac65f42b8408a034a6948448f', X'bbbbbbbbc65f42b8408a034a6948448f', 'n1')");
  expect(mock.mock.calls[2][0]).toMatch('select `c0`.`id`, `c0`.`version` from `couch` as `c0` where `c0`.`id` in (X\'aaaaaaaac65f42b8408a034a6948448f\')');
  expect(mock.mock.calls[3][0]).toMatch('commit');
  expect(mock.mock.calls[4][0]).toMatch("select `c0`.* from `couch` as `c0` where `c0`.`id` = X'aaaaaaaac65f42b8408a034a6948448f' limit 1");
  expect(mock.mock.calls[5][0]).toMatch('begin');
  expect(mock.mock.calls[6][0]).toMatch("update `couch` set `name` = 'n2', `version` = `version` + 1 where `id` = X'aaaaaaaac65f42b8408a034a6948448f' and `version` = 1");
  expect(mock.mock.calls[7][0]).toMatch('select `c0`.`id`, `c0`.`version` from `couch` as `c0` where `c0`.`id` in (X\'aaaaaaaac65f42b8408a034a6948448f\')');
  expect(mock.mock.calls[8][0]).toMatch('commit');
});
