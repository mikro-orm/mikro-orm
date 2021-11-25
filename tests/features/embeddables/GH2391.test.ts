import { Embeddable, Embedded, Entity, MikroORM, PrimaryKey, Property } from '@mikro-orm/core';
import type { SqliteDriver } from '@mikro-orm/sqlite';
import { mockLogger } from '../../helpers';

@Embeddable()
export class NestedAudit {

  @Property({ nullable: true })
  archived?: Date;

  @Property({ onCreate: () => new Date(), onUpdate: () => new Date() })
  updated!: Date;

  @Property({ onCreate: () => new Date() })
  created!: Date;

}

@Embeddable()
export class Audit {

  @Property({ nullable: true })
  archived?: Date;

  @Property({ onCreate: () => new Date(), onUpdate: () => new Date() })
  updated!: Date;

  @Property({ onCreate: () => new Date() })
  created!: Date;

  @Embedded(() => NestedAudit)
  nestedAudit1 = new NestedAudit();

}

@Entity()
export class MyEntity {

  @PrimaryKey()
  id!: number;

  @Embedded(() => Audit)
  audit1 = new Audit();

  @Embedded(() => Audit, { object: true })
  audit2 = new Audit();

}

describe('onCreate and onUpdate in embeddables (GH 2283 and 2391)', () => {

  let orm: MikroORM<SqliteDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [MyEntity, Audit, NestedAudit],
      dbName: ':memory:',
      type: 'sqlite',
    });
    await orm.getSchemaGenerator().createSchema();
  });

  afterAll(async () => {
    await orm.close(true);
  });

  test(`GH issue 2283, 2391`, async () => {
    let line = orm.em.create(MyEntity, {});
    await orm.em.fork().persistAndFlush(line);

    expect(!!line.audit1.created).toBeTruthy();
    expect(!!line.audit1.updated).toBeTruthy();
    expect(!!line.audit2.created).toBeTruthy();
    expect(!!line.audit2.updated).toBeTruthy();

    line = await orm.em.findOneOrFail(MyEntity, line.id);
    expect(!!line.audit1.created).toBeTruthy();
    expect(!!line.audit1.updated).toBeTruthy();
    expect(!!line.audit2.created).toBeTruthy();
    expect(!!line.audit2.updated).toBeTruthy();

    const mock = mockLogger(orm, ['query']);
    await orm.em.flush();
    expect(mock).not.toBeCalled();

    const tmp1 = line.audit1.archived = new Date();
    await orm.em.flush();
    expect(mock).toBeCalledTimes(3);
    expect(mock.mock.calls[1][0]).toMatch('update `my_entity` set `audit1_archived` = ?, `audit1_updated` = ?, `audit1_nested_audit1_updated` = ?, `audit2` = ? where `id` = ?');
    mock.mockReset();

    const tmp2 = line.audit2.archived = new Date();
    await orm.em.flush();
    expect(mock).toBeCalledTimes(3);
    expect(mock.mock.calls[1][0]).toMatch('update `my_entity` set `audit2` = ?, `audit1_updated` = ?, `audit1_nested_audit1_updated` = ? where `id` = ?');
    mock.mockReset();

    const tmp3 = line.audit2.nestedAudit1.archived = new Date();
    await orm.em.flush();
    expect(mock).toBeCalledTimes(3);
    expect(mock.mock.calls[1][0]).toMatch('update `my_entity` set `audit2` = ?, `audit1_updated` = ?, `audit1_nested_audit1_updated` = ? where `id` = ?');
    mock.mockRestore();

    const line2 = await orm.em.fork().findOneOrFail(MyEntity, line.id);
    expect(line2.audit1.archived).toEqual(tmp1);
    expect(line2.audit2.archived).toEqual(tmp2);
    expect(line2.audit2.nestedAudit1.archived).toEqual(tmp3);
  });

});
