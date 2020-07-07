import { Entity, PrimaryKey, MikroORM, BigIntType, OneToMany, Collection, Enum, ManyToOne, Logger, Property } from '@mikro-orm/core';
import { SqliteDriver } from '@mikro-orm/sqlite';

export enum LevelType {
  A = 'A',
  B = 'B',
}

@Entity()
class Job {

  @PrimaryKey({ type: BigIntType })
  id!: string;

  @Property({ type: BigIntType, nullable: true })
  optional?: string | null; // GH issue 631

  @OneToMany('Level', 'job', { orphanRemoval: true })
  levels = new Collection<Level>(this);

}

@Entity()
class Level {

  @Enum({ items: () => LevelType, primary: true })
  type: LevelType;

  @ManyToOne({ primary: true })
  job!: Job;

  constructor(type: LevelType) {
    this.type = type;
  }

}

describe('GH issue 482', () => {

  let orm: MikroORM<SqliteDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Job, Level],
      dbName: 'mikro_orm_test_gh482',
      type: 'postgresql',
    });
    await orm.getSchemaGenerator().ensureDatabase();
    await orm.getSchemaGenerator().dropSchema();
    await orm.getSchemaGenerator().createSchema();
  });

  afterAll(async () => await orm.close(true));

  test(`orphan removal with composite keys`, async () => {
    const job = new Job();
    job.id = '1';
    job.levels.add(new Level(LevelType.A));
    job.levels.add(new Level(LevelType.B));
    await orm.em.persistAndFlush(job);
    job.levels.removeAll();

    const mock = jest.fn();
    const logger = new Logger(mock, true);
    Object.assign(orm.config, { logger });
    orm.config.set('highlight', false);
    orm.config.set('debug', ['query', 'query-params']);
    await orm.em.flush();
    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch(`delete from "level" where "type" = 'A' and "job_id" = '1'`);
    expect(mock.mock.calls[2][0]).toMatch(`delete from "level" where "type" = 'B' and "job_id" = '1'`);
    expect(mock.mock.calls[3][0]).toMatch('commit');
    mock.mock.calls.length = 0;
  });

  test(`GH issue 631 - nullable bigint type`, async () => {
    const mock = jest.fn();
    const logger = new Logger(mock, true);
    Object.assign(orm.config, { logger });
    orm.config.set('highlight', false);
    orm.config.set('debug', ['query', 'query-params']);

    const job = new Job();
    job.id = '2';
    orm.em.persist(job);
    job.optional = '1';
    await orm.em.flush();
    job.optional = null;
    await orm.em.flush();
    job.optional = '1';
    await orm.em.flush();
    job.optional = undefined;
    await orm.em.flush();
    orm.em.clear();
    const j = await orm.em.findOneOrFail(Job, job.id);
    expect(j.optional).toBeNull();

    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch(`insert into "job" ("id", "optional") values ('2', '1') returning "id"`);
    expect(mock.mock.calls[2][0]).toMatch('commit');
    expect(mock.mock.calls[3][0]).toMatch('begin');
    expect(mock.mock.calls[4][0]).toMatch(`update "job" set "optional" = NULL where "id" = '2'`);
    expect(mock.mock.calls[5][0]).toMatch('commit');
    expect(mock.mock.calls[6][0]).toMatch('begin');
    expect(mock.mock.calls[7][0]).toMatch(`update "job" set "optional" = '1' where "id" = '2'`);
    expect(mock.mock.calls[8][0]).toMatch('commit');
    expect(mock.mock.calls[9][0]).toMatch('begin');
    expect(mock.mock.calls[10][0]).toMatch(`update "job" set "optional" = NULL where "id" = '2'`);
    expect(mock.mock.calls[11][0]).toMatch('commit');
  });

});
