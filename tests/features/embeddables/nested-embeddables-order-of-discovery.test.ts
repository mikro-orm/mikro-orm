import { ArrayType, BigIntType, Embeddable, Embedded, Entity, Enum, MikroORM, PrimaryKey, Property } from '@mikro-orm/core';

export enum RestrictionMode {
  Blacklist,
  Whitelist,
}

@Embeddable()
export class RestrictionItem {

  @Enum(() => RestrictionMode)
  mode!: RestrictionMode;

  @Property({ type: ArrayType })
  value: string[] = [];

}

@Embeddable()
export class Restriction {

  @Property({ type: BigIntType })
  permissions!: string;

  @Embedded(() => RestrictionItem)
  role!: RestrictionItem;

  @Embedded(() => RestrictionItem)
  channel!: RestrictionItem;

}

@Entity({ abstract: true })
export class PluginSettings {

  @PrimaryKey({ type: BigIntType })
  id!: string;

  @Embedded(() => Restriction, { nullable: true })
  restriction?: Restriction;

  @Property({ nullable: true })
  enabled?: boolean;

}

@Entity()
export class PluginTestSettings extends PluginSettings {}

describe('GH issue 2242', () => {

  test(`order: [PluginTestSettings, PluginSettings, Restriction, RestrictionItem]`, async () => {
    const orm = await MikroORM.init({
      entities: [PluginTestSettings, PluginSettings, Restriction, RestrictionItem],
      dbName: ':memory:',
      type: 'sqlite',
    });
    await orm.getSchemaGenerator().createSchema();

    const item = orm.em.create(PluginTestSettings, {
      id: '771309736129200140',
      enabled: true,
    });

    expect(item).toBeInstanceOf(PluginTestSettings);
    expect(item.id).toBe('771309736129200140');
    expect(item.enabled).toBe(true);
    await orm.close();
  });

  test(`order: [PluginSettings, PluginTestSettings, Restriction, RestrictionItem]`, async () => {
    const orm = await MikroORM.init({
      entities: [PluginSettings, PluginTestSettings, Restriction, RestrictionItem],
      dbName: ':memory:',
      type: 'sqlite',
    });
    await orm.getSchemaGenerator().createSchema();

    const item = orm.em.create(PluginTestSettings, {
      id: '771309736129200140',
      enabled: true,
    });

    expect(item).toBeInstanceOf(PluginTestSettings);
    expect(item.id).toBe('771309736129200140');
    expect(item.enabled).toBe(true);
    await orm.close();
  });

  test(`order: [PluginTestSettings, Restriction, RestrictionItem, PluginSettings]`, async () => {
    const orm = await MikroORM.init({
      entities: [PluginTestSettings, Restriction, RestrictionItem, PluginSettings],
      dbName: ':memory:',
      type: 'sqlite',
    });
    await orm.getSchemaGenerator().createSchema();

    const item = orm.em.create(PluginTestSettings, {
      id: '771309736129200140',
      enabled: true,
    });

    expect(item).toBeInstanceOf(PluginTestSettings);
    expect(item.id).toBe('771309736129200140');
    expect(item.enabled).toBe(true);
    await orm.close();
  });

  test(`order: [RestrictionItem, PluginTestSettings, Restriction, PluginSettings]`, async () => {
    const orm = await MikroORM.init({
      entities: [RestrictionItem, PluginTestSettings, Restriction, PluginSettings],
      dbName: ':memory:',
      type: 'sqlite',
    });
    await orm.getSchemaGenerator().createSchema();

    const item = orm.em.create(PluginTestSettings, {
      id: '771309736129200140',
      enabled: true,
    });

    expect(item).toBeInstanceOf(PluginTestSettings);
    expect(item.id).toBe('771309736129200140');
    expect(item.enabled).toBe(true);
    await orm.close();
  });

  test(`order: [PluginSettings, Restriction, RestrictionItem, PluginTestSettings]`, async () => {
    const orm = await MikroORM.init({
      entities: [PluginSettings, Restriction, RestrictionItem, PluginTestSettings],
      dbName: ':memory:',
      type: 'sqlite',
    });
    await orm.getSchemaGenerator().createSchema();

    const item = orm.em.create(PluginTestSettings, {
      id: '771309736129200140',
      enabled: true,
    });

    expect(item).toBeInstanceOf(PluginTestSettings);
    expect(item.id).toBe('771309736129200140');
    expect(item.enabled).toBe(true);
    await orm.close();
  });

  test(`order: [Restriction, RestrictionItem, PluginSettings, PluginTestSettings]`, async () => {
    const orm = await MikroORM.init({
      entities: [Restriction, RestrictionItem, PluginSettings, PluginTestSettings],
      dbName: ':memory:',
      type: 'sqlite',
    });
    await orm.getSchemaGenerator().createSchema();

    const item = orm.em.create(PluginTestSettings, {
      id: '771309736129200140',
      enabled: true,
    });

    expect(item).toBeInstanceOf(PluginTestSettings);
    expect(item.id).toBe('771309736129200140');
    expect(item.enabled).toBe(true);
    await orm.close();
  });

  test(`order: [Restriction, RestrictionItem, PluginTestSettings, PluginSettings]`, async () => {
    const orm = await MikroORM.init({
      entities: [Restriction, RestrictionItem, PluginTestSettings, PluginSettings],
      dbName: ':memory:',
      type: 'sqlite',
    });
    await orm.getSchemaGenerator().createSchema();

    const item = orm.em.create(PluginTestSettings, {
      id: '771309736129200140',
      enabled: true,
    });

    expect(item).toBeInstanceOf(PluginTestSettings);
    expect(item.id).toBe('771309736129200140');
    expect(item.enabled).toBe(true);
    await orm.close();
  });

  test(`order: [Restriction, PluginSettings, RestrictionItem, PluginTestSettings]`, async () => {
    const orm = await MikroORM.init({
      entities: [Restriction, PluginSettings, RestrictionItem, PluginTestSettings],
      dbName: ':memory:',
      type: 'sqlite',
    });
    await orm.getSchemaGenerator().createSchema();

    const item = orm.em.create(PluginTestSettings, {
      id: '771309736129200140',
      enabled: true,
    });

    expect(item).toBeInstanceOf(PluginTestSettings);
    expect(item.id).toBe('771309736129200140');
    expect(item.enabled).toBe(true);
    await orm.close();
  });

  test(`order: [RestrictionItem, Restriction, PluginTestSettings, PluginSettings]`, async () => {
    const orm = await MikroORM.init({
      entities: [RestrictionItem, Restriction, PluginTestSettings, PluginSettings],
      dbName: ':memory:',
      type: 'sqlite',
    });
    await orm.getSchemaGenerator().createSchema();

    const item = orm.em.create(PluginTestSettings, {
      id: '771309736129200140',
      enabled: true,
    });

    expect(item).toBeInstanceOf(PluginTestSettings);
    expect(item.id).toBe('771309736129200140');
    expect(item.enabled).toBe(true);
    await orm.close();
  });

  test(`order: [RestrictionItem, Restriction, PluginSettings, PluginTestSettings]`, async () => {
    const orm = await MikroORM.init({
      entities: [RestrictionItem, Restriction, PluginSettings, PluginTestSettings],
      dbName: ':memory:',
      type: 'sqlite',
    });
    await orm.getSchemaGenerator().createSchema();

    const item = orm.em.create(PluginTestSettings, {
      id: '771309736129200140',
      enabled: true,
    });

    expect(item).toBeInstanceOf(PluginTestSettings);
    expect(item.id).toBe('771309736129200140');
    expect(item.enabled).toBe(true);
    await orm.close();
  });

});
