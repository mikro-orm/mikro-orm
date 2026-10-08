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

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [Module, ModuleA, ModuleB, ModuleC],
    dbName: 'memory://',
  });
  await orm.schema.create();
});

afterAll(() => orm.close(true));

test('GH #8417: STI children sharing an object embeddable column with different embeddable classes', async () => {
  const em = orm.em.fork();
  em.create(ModuleA, { type: 'a', config: { displayMode: 'custom', customFieldId: 'x' } });
  em.create(ModuleB, { type: 'b', config: { displayMode: 'inline', showOnInit: true } });
  em.create(ModuleC, { type: 'c', config: { displayMode: 'custom', customFieldId: 'y' } });
  await em.flush();
  em.clear();

  const all = await em.findAll(Module, { orderBy: { id: 1 } });
  expect(all.map(m => [m.constructor.name, (m as ModuleA | ModuleB).config])).toEqual([
    ['ModuleA', { displayMode: 'custom', customFieldId: 'x' }],
    ['ModuleB', { displayMode: 'inline', showOnInit: true }],
    ['ModuleC', { displayMode: 'custom', customFieldId: 'y' }],
  ]);
});
