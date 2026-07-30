import { Collection, MikroORM, PrimaryKeyProp } from '@mikro-orm/sqlite';
import {
  Entity,
  ManyToMany,
  ManyToOne,
  PrimaryKey,
  Property,
  ReflectMetadataProvider,
} from '@mikro-orm/decorators/legacy';

@Entity()
class Tag {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @ManyToMany(() => Param, param => param.tags)
  params = new Collection<Param>(this);

  @ManyToMany(() => Config, config => config.tags)
  configs = new Collection<Config>(this);

  @ManyToMany(() => NestedParam, param => param.tags)
  nestedParams = new Collection<NestedParam>(this);
}

@Entity()
class Param {
  [PrimaryKeyProp]?: ['bar', 'baz'];

  @PrimaryKey()
  bar!: number;

  @PrimaryKey()
  baz!: number;

  @ManyToMany(() => Tag, tag => tag.params, { pivotTable: 'taggables', discriminator: 'taggable', owner: true })
  tags = new Collection<Tag>(this);
}

// shares the pivot with `Param`, so each owner has to resolve its own metadata from the discriminator
@Entity()
class Config {
  [PrimaryKeyProp]?: ['bar', 'baz'];

  @PrimaryKey()
  bar!: number;

  @PrimaryKey()
  baz!: number;

  @ManyToMany(() => Tag, tag => tag.configs, { pivotTable: 'taggables', discriminator: 'taggable', owner: true })
  tags = new Collection<Tag>(this);
}

// composite PK built from a relation to another composite PK entity, so the pivot FK is nested
@Entity()
class NestedParam {
  [PrimaryKeyProp]?: ['param', 'qux'];

  @ManyToOne(() => Param, { joinColumns: ['np_bar', 'np_baz'], primary: true })
  param!: Param;

  @PrimaryKey()
  qux!: number;

  @ManyToMany(() => Tag, tag => tag.nestedParams, {
    pivotTable: 'nested_taggables',
    discriminator: 'taggable',
    owner: true,
  })
  tags = new Collection<Tag>(this);
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Tag, Param, Config, NestedParam],
    dbName: ':memory:',
    metadataProvider: ReflectMetadataProvider,
  });
  await orm.schema.refresh();
});

afterAll(async () => {
  await orm.close(true);
});

// the owner side of a Rails style polymorphic M:N keys the pivot query off the owner FK, which is
// spread over several columns once the owner has a composite PK
test('owner side of a polymorphic M:N with a composite PK owner', async () => {
  const em = orm.em.fork();
  await em.insertMany(Tag, [
    { id: 10, name: 't1' },
    { id: 11, name: 't2' },
  ]);
  await em.insert(Param, { bar: 1, baz: 2, tags: [10] });
  await em.insert(Param, { bar: 3, baz: 4, tags: [10, 11] });
  // same PK values under a different discriminator, so a query that ignores it would overmatch
  await em.insert(Config, { bar: 1, baz: 2, tags: [11] });

  const params = await em.fork().find(Param, { bar: { $in: [1, 3] } }, { populate: ['tags'], orderBy: { bar: 'asc' } });
  expect(params.map(p => p.tags.getIdentifiers())).toEqual([[10], [10, 11]]);

  const configs = await em.fork().find(Config, {}, { populate: ['tags'] });
  expect(configs.map(c => c.tags.getIdentifiers())).toEqual([[11]]);

  const tags = await em.fork().find(Tag, { id: { $in: [10, 11] } }, { populate: ['params'], orderBy: { id: 'asc' } });
  expect(tags.map(t => t.params.getIdentifiers())).toEqual([
    [
      [1, 2],
      [3, 4],
    ],
    [[3, 4]],
  ]);
});

test('owner side of a polymorphic M:N with a nested composite PK owner', async () => {
  const em = orm.em.fork();
  await em.insert(Tag, { id: 20, name: 't3' });
  await em.insert(Param, { bar: 5, baz: 6 });
  await em.insert(NestedParam, { param: [5, 6], qux: 7, tags: [20] });

  const params = await em.fork().find(NestedParam, {}, { populate: ['tags'] });
  expect(params.map(p => p.tags.getIdentifiers())).toEqual([[20]]);
});

test('owner side of a polymorphic M:N with a composite PK owner via a :ref populate hint', async () => {
  const em = orm.em.fork();
  await em.insert(Tag, { id: 40, name: 't6' });
  await em.insert(Param, { bar: 12, baz: 13, tags: [40] });

  const param = await em.fork().findOneOrFail(Param, { bar: 12, baz: 13 }, { populate: ['tags:ref'] });
  expect(param.tags.getIdentifiers()).toEqual([40]);
});
