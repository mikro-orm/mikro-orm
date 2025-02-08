import { Entity, MikroORM, PrimaryKey, Property, wrap, Hidden } from '@mikro-orm/sqlite';
import { mockLogger } from '../../helpers';

@Entity()
export class EntityWithHiddenProp {

  @PrimaryKey()
  id!: number;

  @Property()
  notHiddenProp: string = 'foo';

  @Property({ hidden: true })
  hiddenProp: Hidden<string> = 'hidden prop';

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [EntityWithHiddenProp],
    dbName: ':memory:',
  });
  await orm.schema.createSchema();
});

beforeEach(async () => {
  await orm.schema.clearDatabase();
});

afterAll(() => orm.close(true));


describe('hidden properties are still included when cached (GH 3294)', () => {

  test('single entity (findOne)', async () => {
    const singleEntity = new EntityWithHiddenProp();
    await orm.em.persistAndFlush(singleEntity);
    orm.em.clear();

    const mockLog = mockLogger(orm, ['query']);

    const res1 = await orm.em.findOneOrFail(EntityWithHiddenProp, 1, { cache: 50 });
    expect(mockLog.mock.calls).toHaveLength(1);
    orm.em.clear();

    const res2 = await orm.em.findOneOrFail(EntityWithHiddenProp, 1, { cache: 50 });
    expect(mockLog.mock.calls).toHaveLength(1); // cache hit, no new query fired

    // Expect hidden prop to be accessible in cached and uncached versions
    expect(res1.hiddenProp).toStrictEqual('hidden prop');
    expect(res1.hiddenProp).toStrictEqual(res2.hiddenProp);

    // Expect hidden prop to still be hidden when using `toJSON`
    // @ts-expect-error
    expect(wrap(res1).toJSON().hiddenProp).toBeUndefined();
    // @ts-expect-error
    expect(wrap(res2).toJSON().hiddenProp).toBeUndefined();
  });

  test('multiple entities (find)', async () => {
    const multipleEntities = Array.from({ length: 5 }, () => new EntityWithHiddenProp());
    await orm.em.persistAndFlush(multipleEntities);
    orm.em.clear();

    const mockLog = mockLogger(orm, ['query']);

    const res1 = await orm.em.find(EntityWithHiddenProp, {}, { cache: 50 });
    expect(mockLog.mock.calls).toHaveLength(1);
    orm.em.clear();

    const res2 = await orm.em.find(EntityWithHiddenProp, {}, { cache: 50 });
    expect(mockLog.mock.calls).toHaveLength(1); // cache hit, no new query fired

    // Expect both hidden and not hidden props to be accessible in cached and uncached versions
    expect(res1.map(e => ({ hidden: e.hiddenProp, notHidden: e.notHiddenProp })))
      .toEqual(res2.map(e => ({ hidden: e.hiddenProp, notHidden: e.notHiddenProp })));
  });

});
