import { Embeddable, Embedded, Entity, MikroORM, PrimaryKey, Property, QueryOrder } from '@mikro-orm/core';
import type { AbstractSqlDriver } from '@mikro-orm/knex';


@Embeddable()
export class ValueObject {

  @Property({ nullable: true })
  test!: string;

}

@Entity()
export class MainEntity {

  @PrimaryKey()
  id!: number;

  @Embedded()
  vo: ValueObject = new ValueObject();

}

let orm: MikroORM<AbstractSqlDriver>;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [MainEntity, ValueObject],
    dbName: ':memory:',
    type: 'better-sqlite',
  });
  await orm.getSchemaGenerator().createSchema();
});

afterAll(() => orm.close(true));

describe('GH Issue #3325', () => {
  test('update embedded with qb does not work as expected', async () => {
    const main = new MainEntity();
    await orm.em.fork().persistAndFlush(main);

    await orm.em.fork().qb(MainEntity).update({ vo: { test: 'toto' } }).where({ id: 1 }).execute();

    const fetchedMain = await orm.em.fork().findOne(MainEntity, 1);
    expect(fetchedMain).toBeInstanceOf(MainEntity);
    expect(fetchedMain!.vo).toBeInstanceOf(ValueObject);
    expect(fetchedMain!.vo.test).toEqual('toto');
  });

  test('update embedded with qb works if using the column name and ts-ignore', async () => {
    const main = new MainEntity();
    await orm.em.fork().persistAndFlush(main);

    // @ts-ignore
    await orm.em.fork().qb(MainEntity).update({ vo_test: 'toto' }).where({ id: 1 }).execute();

    const fetchedMain = await orm.em.fork().findOne(MainEntity, 1);
    expect(fetchedMain).toBeInstanceOf(MainEntity);
    expect(fetchedMain!.vo).toBeInstanceOf(ValueObject);
    expect(fetchedMain!.vo.test).toEqual('toto');
  });

  test('qb works as expected with embedded in order by', async () => {
    const main = new MainEntity();
    await orm.em.fork().persistAndFlush(main);

    const fetchedMain = await orm.em.fork().qb(MainEntity).select('*').orderBy({ vo: { test: QueryOrder.ASC } }).getSingleResult();
    expect(fetchedMain).toBeInstanceOf(MainEntity);
  });
});
