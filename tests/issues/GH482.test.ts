import { Entity, PrimaryKey, MikroORM, ReflectMetadataProvider, BigIntType, OneToMany, Collection, Enum, ManyToOne, Logger } from '@mikro-orm/core';
import { SqliteDriver } from '@mikro-orm/sqlite';

export enum LevelType {
  A = 'A',
  B = 'B',
}

@Entity()
class Job {

  @PrimaryKey({ type: BigIntType })
  id!: string;

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
      metadataProvider: ReflectMetadataProvider,
      cache: { enabled: false },
    });
    await orm.getSchemaGenerator().ensureDatabase();
    await orm.getSchemaGenerator().dropSchema();
    await orm.getSchemaGenerator().createSchema();
  });

  afterAll(async () => await orm.close(true));

  test(`orphan removal with composite keys`, async () => {
    const job = new Job();
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
  });

});
