import { Embeddable, Embedded, Entity, MikroORM, OptionalProps, PrimaryKey, Property, UnderscoreNamingStrategy } from '@mikro-orm/sqlite';
import { mockLogger } from '../../helpers.js';

@Embeddable()
class NestedAudit {

  @Property({ nullable: true, name: 'archivedAt' })
  archived?: Date;

  @Property({ onCreate: () => new Date(), onUpdate: () => new Date() })
  updatedAt!: Date;

  @Property({ onCreate: () => new Date() })
  created!: Date;

}

@Embeddable()
class Audit {

  @Property({ nullable: true, name: 'archivedAt' })
  archived?: Date;

  @Property({ onCreate: () => new Date(), onUpdate: () => new Date() })
  updatedAt!: Date;

  @Property({ onCreate: () => new Date() })
  created!: Date;

  @Embedded(() => NestedAudit)
  nestedAudit1 = new NestedAudit();

}

@Entity()
class MyEntity {

  [OptionalProps]?: 'fooAudit1' | 'barAudit2';

  @PrimaryKey()
  id!: number;

  @Embedded(() => Audit)
  fooAudit1 = new Audit();

  @Embedded(() => Audit, { object: true })
  barAudit2 = new Audit();

}

describe('onCreate and onUpdate in embeddables (GH 2283 and 2391)', () => {

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [MyEntity],
      dbName: ':memory:',
      namingStrategy: class extends UnderscoreNamingStrategy {

        propertyToColumnName(propertyName: string, object?: boolean): string {
          if (object) {
            return propertyName;
          }

          return super.propertyToColumnName(propertyName, object);
        }

      },
    });
    await orm.schema.createSchema();
  });

  afterAll(async () => {
    await orm.close(true);
  });

  test('result mapper', async () => {
    expect(orm.em.getComparator().getResultMapper(MyEntity.name).toString()).toMatchSnapshot();
  });

  test(`GH issue 2283, 2391`, async () => {
    const mock = mockLogger(orm, ['query', 'query-params']);
    let line = orm.em.create(MyEntity, {});
    line.fooAudit1.created = new Date(1698010995740);
    line.fooAudit1.updatedAt = new Date(1698010995740);
    line.fooAudit1.nestedAudit1.created = new Date(1698010995740);
    line.fooAudit1.nestedAudit1.updatedAt = new Date(1698010995740);
    line.barAudit2.created = new Date(1698010995740);
    line.barAudit2.updatedAt = new Date(1698010995740);
    line.barAudit2.nestedAudit1.created = new Date(1698010995740);
    line.barAudit2.nestedAudit1.updatedAt = new Date(1698010995740);
    await orm.em.fork().persistAndFlush(line);
    expect(mock).toHaveBeenCalledTimes(3);
    expect(mock.mock.calls[1][0]).toMatch('insert into `my_entity` (`foo_audit1_updated_at`, `foo_audit1_created`, `foo_audit1_nested_audit1_updated_at`, `foo_audit1_nested_audit1_created`, `bar_audit2`) values (1698010995740, 1698010995740, 1698010995740, 1698010995740, \'{"updatedAt":"2023-10-22T21:43:15.740Z","created":"2023-10-22T21:43:15.740Z","nestedAudit1":{"updatedAt":"2023-10-22T21:43:15.740Z","created":"2023-10-22T21:43:15.740Z"}}\') returning `id`');
    mock.mockReset();

    expect(!!line.fooAudit1.created).toBeTruthy();
    expect(!!line.fooAudit1.updatedAt).toBeTruthy();
    expect(!!line.barAudit2.created).toBeTruthy();
    expect(!!line.barAudit2.updatedAt).toBeTruthy();

    line = await orm.em.findOneOrFail(MyEntity, line.id);

    expect(mock).toHaveBeenCalledTimes(1);
    expect(mock.mock.calls[0][0]).toMatch('select `m0`.* from `my_entity` as `m0` where `m0`.`id` = 1 limit 1');
    mock.mockReset();

    expect(!!line.fooAudit1.created).toBeTruthy();
    expect(!!line.fooAudit1.updatedAt).toBeTruthy();
    expect(!!line.barAudit2.created).toBeTruthy();
    expect(!!line.barAudit2.updatedAt).toBeTruthy();

    await orm.em.flush();
    expect(mock).not.toHaveBeenCalled();

    vi.useFakeTimers();
    vi.setSystemTime(new Date(1698010995749));
    const tmp1 = line.fooAudit1.archived = new Date(1698010995749);
    await orm.em.flush();
    expect(mock).toHaveBeenCalledTimes(3);
    expect(mock.mock.calls[1][0]).toMatch('update `my_entity` set `foo_audit1_archivedAt` = 1698010995749, `foo_audit1_updated_at` = 1698010995749, `foo_audit1_nested_audit1_updated_at` = 1698010995749, `bar_audit2` = \'{"updatedAt":"2023-10-22T21:43:15.749Z","created":"2023-10-22T21:43:15.740Z","nestedAudit1":{"updatedAt":"2023-10-22T21:43:15.749Z","created":"2023-10-22T21:43:15.740Z"}}\' where `id` = 1');
    mock.mockReset();

    const tmp2 = line.barAudit2.archived = new Date(1698010995750);
    await orm.em.flush();
    expect(mock).toHaveBeenCalledTimes(3);
    expect(mock.mock.calls[1][0]).toMatch('update `my_entity` set `bar_audit2` = \'{"archivedAt":"2023-10-22T21:43:15.750Z","updatedAt":"2023-10-22T21:43:15.749Z","created":"2023-10-22T21:43:15.740Z","nestedAudit1":{"updatedAt":"2023-10-22T21:43:15.749Z","created":"2023-10-22T21:43:15.740Z"}}\' where `id` = 1');
    mock.mockReset();

    const tmp3 = line.barAudit2.nestedAudit1.archived = new Date(1698010995751);
    await orm.em.flush();
    expect(mock).toHaveBeenCalledTimes(3);
    expect(mock.mock.calls[1][0]).toMatch('update `my_entity` set `bar_audit2` = \'{"archivedAt":"2023-10-22T21:43:15.750Z","updatedAt":"2023-10-22T21:43:15.749Z","created":"2023-10-22T21:43:15.740Z","nestedAudit1":{"archivedAt":"2023-10-22T21:43:15.751Z","updatedAt":"2023-10-22T21:43:15.749Z","created":"2023-10-22T21:43:15.740Z"}}\' where `id` = 1');
    mock.mockRestore();

    const line2 = await orm.em.fork().findOneOrFail(MyEntity, line.id);
    expect(line2.fooAudit1.archived).toEqual(tmp1);
    expect(line2.barAudit2.archived).toEqual(tmp2);
    expect(line2.barAudit2.nestedAudit1.archived).toEqual(tmp3);

    vi.useRealTimers();
  });

});
