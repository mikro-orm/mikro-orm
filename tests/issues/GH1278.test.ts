import { Entity, MikroORM, OneToOne, PrimaryKey, Property } from '@mikro-orm/core';
import type { SqliteDriver } from '@mikro-orm/sqlite';
import { mockLogger } from '../bootstrap';

@Entity()
export class GroupCode {

  @PrimaryKey()
  id!: number;

  @Property()
  code: string = 'some-randomly-generated-code';

  @OneToOne({ type: 'Group', mappedBy: 'code', nullable: true })
  group?: any;

}

@Entity()
export class Group {

  @PrimaryKey()
  id!: number;

  @OneToOne({ nullable: true, orphanRemoval: true })
  code?: GroupCode;

}

describe('GH issue 1278', () => {

  let orm: MikroORM<SqliteDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      type: 'sqlite',
      dbName: ':memory:',
      entities: [Group, GroupCode],
    });
    await orm.getSchemaGenerator().createSchema();
  });

  afterAll(async () => {
    await orm.close(true);
  });

  test(`GH issue 1278`, async () => {
    const mock = mockLogger(orm, ['query']);

    const group = new Group();
    const groupCode = new GroupCode();
    group.code = groupCode;
    await orm.em.persistAndFlush(group);

    await orm.em.remove(groupCode).flush();
    expect(group.code).toBeUndefined();
    group.code = new GroupCode();
    expect(group.code.id).toBeUndefined();
    await orm.em.persistAndFlush(group);
    expect(group.code.id).not.toBeUndefined();

    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch('insert into `group_code` (`code`) values (?)');
    expect(mock.mock.calls[2][0]).toMatch('insert into `group` (`code_id`) values (?)');
    expect(mock.mock.calls[3][0]).toMatch('commit');
    expect(mock.mock.calls[4][0]).toMatch('begin');
    expect(mock.mock.calls[5][0]).toMatch('delete from `group_code` where `id` in (?)');
    expect(mock.mock.calls[6][0]).toMatch('commit');
    expect(mock.mock.calls[7][0]).toMatch('begin');
    expect(mock.mock.calls[8][0]).toMatch('insert into `group_code` (`code`) values (?)');
    expect(mock.mock.calls[9][0]).toMatch('update `group` set `code_id` = ? where `id` = ?');
    expect(mock.mock.calls[10][0]).toMatch('commit');
  });

});
