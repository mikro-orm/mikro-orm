import { Entity, PrimaryKey, MikroORM, BigIntType, OneToMany, Collection, Enum, ManyToOne, Property } from '@mikro-orm/core';
import type { SqliteDriver } from '@mikro-orm/sqlite';
import { mockLogger } from '../bootstrap';

export enum LevelType {
  A = 'a',
  B = 'b',
}

export enum NumLevelType {
  A = 1,
  B = 2,
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

  @Enum({ items: () => LevelType, array: true, default: [LevelType.A] })
  types: LevelType[] = [LevelType.A];

  @Enum({ items: () => NumLevelType, array: true, default: [NumLevelType.A] })
  numTypes: NumLevelType[] = [NumLevelType.A];

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

  afterAll(() => orm.close(true));

  test(`orphan removal with composite keys`, async () => {
    const job = new Job();
    job.id = '1';
    job.levels.add(new Level(LevelType.A));
    job.levels.add(new Level(LevelType.B));
    await orm.em.persistAndFlush(job);
    job.levels.removeAll();

    const mock = mockLogger(orm);

    orm.config.set('debug', ['query', 'query-params']);
    await orm.em.flush();
    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch(`delete from "level" where ("type", "job_id") in (('a', '1'), ('b', '1'))`);
    expect(mock.mock.calls[2][0]).toMatch('commit');
    mock.mock.calls.length = 0;
  });

  test(`GH issue 631 - nullable bigint type`, async () => {
    const mock = mockLogger(orm);

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

  test(`GH issue 476 - enum arrays`, async () => {
    const a = new Level(LevelType.A);
    a.job = new Job();
    a.job.id = '3';
    await orm.em.persistAndFlush(a);
    expect(a.types).toEqual([LevelType.A]);
    expect(a.numTypes).toEqual([NumLevelType.A]);
    a.types.push(LevelType.B);
    a.numTypes.push(NumLevelType.B);
    await orm.em.flush();
    expect(a.types).toEqual([LevelType.A, LevelType.B]);
    expect(a.types).toEqual(['a', 'b']);
    expect(a.types).toEqual([LevelType.A, LevelType.B]);
    expect(a.numTypes).toEqual([NumLevelType.A, NumLevelType.B]);
    expect(a.numTypes).toEqual([1, 2]);
    orm.em.clear();

    const a1 = await orm.em.findOneOrFail(Level, { types: { $contains: [LevelType.A, LevelType.B] } });
    expect(a1.types).toEqual([LevelType.A, LevelType.B]);
    expect(a1.numTypes).toEqual([NumLevelType.A, NumLevelType.B]);
    a1.types = [LevelType.B, LevelType.A];
    a1.numTypes = [NumLevelType.B, NumLevelType.A];
    await orm.em.flush();
    orm.em.clear();

    const a2 = await orm.em.findOneOrFail(Level, { types: { $contains: [LevelType.A, LevelType.B] } });
    expect(a2.types).toEqual([LevelType.B, LevelType.A]);
    expect(a2.numTypes).toEqual([NumLevelType.B, NumLevelType.A]);

    a2.types = ['c' as any];
    await expect(orm.em.flush()).rejects.toThrowError(`Invalid enum array items provided in Level.types: [ 'c' ]`);

    a2.types = [];
    a2.numTypes = [NumLevelType.B, 3];
    await expect(orm.em.flush()).rejects.toThrowError(`Invalid enum array items provided in Level.numTypes: [ 3 ]`);
  });

});
