import { Embeddable, Embedded, Entity, MikroORM, PrimaryKey, Property } from '@mikro-orm/core';

@Embeddable()
export class LoopOptions {

  @Property()
  'enabled-prop' = false;

  @Property()
  'type-prop' = 'a';

}

@Embeddable()
export class Options {

  @Embedded(() => LoopOptions, { object: true })
  'loop-prop' = new LoopOptions();

}

@Entity()
export class PlayerEntity {

  @PrimaryKey()
  id!: number;

  @Embedded(() => Options, { object: true })
  'options-prop' = new Options();

  @Property({ name: 'name-with-hyphens' })
  test: string = 'abc';

}

describe('GH issue 1958', () => {

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [PlayerEntity, Options, LoopOptions],
      dbName: ':memory:',
      type: 'sqlite',
    });
    await orm.getSchemaGenerator().createSchema();
  });

  afterAll(async () => {
    await orm.close();
  });

  test(`GH issue 1958`, async () => {
    const e = new PlayerEntity();
    expect(e['options-prop']).toBeInstanceOf(Options);
    expect(e['options-prop']['loop-prop']).toBeInstanceOf(LoopOptions);
    expect(e['options-prop']['loop-prop']['enabled-prop']).toBe(false);
    expect(e['options-prop']['loop-prop']['type-prop']).toBe('a');
    await orm.em.persistAndFlush(e);
    orm.em.clear();

    const e1 = await orm.em.findOneOrFail(PlayerEntity, e);
    expect(e1['options-prop']).toBeInstanceOf(Options);
    expect(e1['options-prop']['loop-prop']).toBeInstanceOf(LoopOptions);
    expect(e1['options-prop']['loop-prop']['enabled-prop']).toBe(false);
    expect(e1['options-prop']['loop-prop']['type-prop']).toBe('a');
  });

});
