import { Embeddable, Embedded, Entity, MikroORM, PrimaryKey, Property } from '@mikro-orm/core';

@Embeddable()
export class LoopOptions {

  @Property()
  enabled: boolean = false;

  @Property()
  type: string = 'a';

}

@Embeddable()
export class Options {

  @Embedded(() => LoopOptions, { object: true })
  loop = new LoopOptions();

}

@Entity()
export class PlayerEntity {

  @PrimaryKey()
  id!: number;

  @Embedded(() => Options, { object: true })
  options = new Options();

}

describe('GH issue 2149', () => {

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Options, LoopOptions, PlayerEntity],
      dbName: ':memory:',
      type: 'sqlite',
    });
    await orm.getSchemaGenerator().createSchema();
  });

  afterAll(async () => {
    await orm.close();
  });

  test(`GH issue 2149`, async () => {
    const ent = new PlayerEntity();
    expect(ent.options).toBeInstanceOf(Options);
    expect(ent.options.loop).toBeInstanceOf(LoopOptions);
    expect(ent.options.loop.enabled).toBe(false);
    expect(ent.options.loop.type).toBe('a');
    await orm.em.persistAndFlush(ent);
    orm.em.clear();

    const e = await orm.em.findOneOrFail(PlayerEntity, ent);
    expect(e.options).toBeInstanceOf(Options);
    expect(e.options.loop).toBeInstanceOf(LoopOptions);
    expect(e.options.loop.enabled).toBe(false);
    expect(e.options.loop.type).toBe('a');
  });

});
