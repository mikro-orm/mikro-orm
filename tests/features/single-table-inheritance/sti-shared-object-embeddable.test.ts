import { MikroORM } from '@mikro-orm/pglite';
import {
  Embeddable,
  Embedded,
  Entity,
  PrimaryKey,
  Property,
  ReflectMetadataProvider,
} from '@mikro-orm/decorators/legacy';

@Embeddable()
class BasicConfig {
  @Property({ type: 'string' })
  displayMode!: string;

  @Property({ type: 'string', nullable: true })
  customFieldId?: string;
}

@Embeddable()
class ExtendedConfig {
  @Property({ type: 'string' })
  displayMode!: string;

  @Property({ type: 'boolean', nullable: true })
  showOnInit?: boolean;
}

@Entity({ abstract: true, discriminatorColumn: 'type' })
abstract class Module {
  @PrimaryKey({ type: 'number' })
  id!: number;

  @Property({ type: 'string' })
  type!: string;
}

@Entity({ discriminatorValue: 'a' })
class ModuleA extends Module {
  @Embedded(() => BasicConfig, { object: true, nullable: true })
  config?: BasicConfig;
}

@Entity({ discriminatorValue: 'b' })
class ModuleB extends Module {
  @Embedded(() => ExtendedConfig, { object: true, nullable: true })
  config?: ExtendedConfig;
}

@Entity({ discriminatorValue: 'c' })
class ModuleC extends Module {
  @Embedded(() => BasicConfig, { object: true, nullable: true })
  config?: BasicConfig;
}

describe.each([
  ['two subtypes', [Module, ModuleA, ModuleB]],
  ['three subtypes', [Module, ModuleA, ModuleB, ModuleC]],
])('STI subtypes sharing an object embeddable column with different classes (%s)', (_, entities) => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities,
      dbName: 'memory://',
    });
    await orm.schema.create();
  });

  afterAll(() => orm.close(true));

  test('stores the JSON under the field names of the subtype embeddable', async () => {
    const em = orm.em.fork();
    em.create(ModuleA, { type: 'a', config: { displayMode: 'custom', customFieldId: 'x' } });
    const b = em.create(ModuleB, { type: 'b', config: { displayMode: 'inline', showOnInit: true } });
    await em.flush();

    expect(await em.execute('select type, config from module order by id')).toEqual([
      { type: 'a', config: { display_mode: 'custom', custom_field_id: 'x' } },
      { type: 'b', config: { display_mode: 'inline', show_on_init: true } },
    ]);

    b.config!.showOnInit = false;
    await em.flush();
    em.clear();

    expect(await em.execute(`select config from module where type = 'b'`)).toEqual([
      { config: { display_mode: 'inline', show_on_init: false } },
    ]);
    await expect(em.count(ModuleA, { config: { displayMode: 'custom' } })).resolves.toBe(1);
    await expect(em.count(ModuleB, { config: { showOnInit: false } })).resolves.toBe(1);

    const all = await em.findAll(Module, { orderBy: { id: 1 } });
    expect(all.map(m => (m as ModuleA | ModuleB).config)).toEqual([
      { displayMode: 'custom', customFieldId: 'x' },
      { displayMode: 'inline', showOnInit: false },
    ]);
  });
});
