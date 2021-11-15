import { Embeddable, Embedded, Entity, MikroORM, PrimaryKey, Property } from '@mikro-orm/core';
import type { SqliteDriver } from '@mikro-orm/sqlite';
import { SchemaGenerator } from '@mikro-orm/sqlite';

@Embeddable()
export class Lock {

  @Property()
  createdAt: Date = new Date();

}

@Entity()
export class File {

  @PrimaryKey()
  id!: number;

  @Embedded(() => Lock, {
    nullable: true,
    object: true, // error only throws with object mode
  })
  lock?: Lock;

}

describe('GH issue 2233', () => {

  let orm: MikroORM<SqliteDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Lock, File],
      dbName: ':memory:',
      type: 'sqlite',
    });
    await new SchemaGenerator(orm.em).createSchema();
  });

  afterAll(() => orm.close(true));

  test('cascade persist with pre-filled PK and with cycles', async () => {
    const file = new File();
    await orm.em.fork().persistAndFlush(file);

    const [raw] = await orm.em
      .createQueryBuilder(File)
      .select('*')
      .where({ id: file.id })
      .limit(1)
      .getKnexQuery();

    const mapped = orm.em.map(File, raw);
    expect(mapped).toEqual({ id: 1 });
  });

});
