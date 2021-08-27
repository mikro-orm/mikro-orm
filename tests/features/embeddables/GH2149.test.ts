import { Embeddable, Embedded, Entity, MikroORM, PrimaryKey, Property } from '@mikro-orm/core';

@Embeddable()
export class LoopOptions {

  @Property()
  enabled = false;

  @Property()
  type = 'a';

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
      entities: [PlayerEntity, Options, LoopOptions],
      dbName: 'test',
      type: 'mongo',
    }, false);
  });

  afterAll(async () => {
    await orm.close();
  });

  test(`GH issue 1912`, async () => {
    const e = new PlayerEntity();
    expect(e.options).toBeInstanceOf(Options);
    expect(e.options.loop).toBeInstanceOf(LoopOptions);
    expect(e.options.loop.enabled).toBe(false);
    expect(e.options.loop.type).toBe('a');
  });

});
