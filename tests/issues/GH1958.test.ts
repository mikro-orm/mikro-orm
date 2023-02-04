import { Embeddable, Embedded, Entity, MikroORM, OneToOne, PrimaryKey, Property, Rel } from '@mikro-orm/core';
import { SqliteDriver } from '@mikro-orm/sqlite';

@Embeddable()
class LoopOptions {

  @Property()
  'enabled-prop': boolean = false;

  @Property()
  'type-prop': string = 'a';

}

@Embeddable()
class Options {

  @Embedded(() => LoopOptions, { object: true })
  'loop-prop' = new LoopOptions();

}

@Entity()
class PlayerEntity {

  @PrimaryKey()
  id!: number;

  @Embedded(() => Options, { object: true })
  'options-prop' = new Options();

  @Property({ name: 'name-with-hyphens' })
  test: string = 'abc';

  @OneToOne({ entity: () => ParentEntity, nullable: true })
  'parent-case-property'?: Rel<ParentEntity>;

}

@Entity()
class ParentEntity {

  @PrimaryKey()
  id!: number;

  @OneToOne({ entity: () => PlayerEntity, nullable: true, mappedBy: 'parent-case-property' })
  'kebab-case-property': PlayerEntity;

}

describe('GH issue 1958', () => {

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [PlayerEntity, Options, LoopOptions],
      dbName: ':memory:',
      driver: SqliteDriver,
    });
    await orm.schema.createSchema();
  });

  afterAll(async () => {
    await orm.close();
  });

  test(`GH issue 1958`, async () => {
    const e = new PlayerEntity();
    e['parent-case-property'] = new ParentEntity();
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
    expect(e1['parent-case-property']).toBeInstanceOf(ParentEntity);
  });

});
