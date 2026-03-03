import { MikroORM } from '@mikro-orm/core';
import {
  Embeddable,
  Embedded,
  Entity,
  PrimaryKey,
  Property,
  ReflectMetadataProvider,
} from '@mikro-orm/decorators/legacy';
import { SqliteDriver } from '@mikro-orm/sqlite';

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
      metadataProvider: ReflectMetadataProvider,
      entities: [PlayerEntity],
      dbName: ':memory:',
      driver: SqliteDriver,
    });
    await orm.schema.create();
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
    await orm.em.persist(ent).flush();
    orm.em.clear();

    const e = await orm.em.findOneOrFail(PlayerEntity, ent);
    expect(e.options).toBeInstanceOf(Options);
    expect(e.options.loop).toBeInstanceOf(LoopOptions);
    expect(e.options.loop.enabled).toBe(false);
    expect(e.options.loop.type).toBe('a');
  });
});
