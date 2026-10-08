import { defineEntity, MikroORM, p } from '@mikro-orm/sqlite';

describe('STI children with conflicting column names', () => {
  const Item = defineEntity({
    name: 'Item',
    abstract: true,
    discriminatorColumn: 'type',
    properties: {
      id: p.integer().primary(),
      type: p.string(),
    },
  });
  const TextItem = defineEntity({
    name: 'TextItem',
    extends: Item,
    discriminatorValue: 'text',
    properties: { value: p.string().fieldName('text_value') },
  });
  const OtherItem = defineEntity({
    name: 'OtherItem',
    extends: Item,
    discriminatorValue: 'other',
    properties: { value: p.string().fieldName('other_value') },
  });

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({ entities: [Item, TextItem, OtherItem], dbName: ':memory:' });
    await orm.schema.create();
  });

  afterAll(() => orm.close(true));

  test('query and load via child and root', async () => {
    const em = orm.em.fork();
    em.create(TextItem, { value: 'foo' });
    em.create(OtherItem, { value: 'bar' });
    await em.flush();
    em.clear();

    expect((await em.findOneOrFail(TextItem, { value: 'foo' })).value).toBe('foo');
    expect((await em.findOneOrFail(OtherItem, { value: 'bar' })).value).toBe('bar');
    em.clear();

    const all = await em.findAll(Item, { orderBy: { id: 1 } });
    expect(all.map(i => [i.constructor.name, (i as any).value])).toEqual([
      ['TextItem', 'foo'],
      ['OtherItem', 'bar'],
    ]);
  });
});

describe('STI children with conflicting property types', () => {
  const Item = defineEntity({
    name: 'Item',
    abstract: true,
    discriminatorColumn: 'type',
    properties: {
      id: p.integer().primary(),
      type: p.string(),
    },
  });
  const TextItem = defineEntity({
    name: 'TextItem',
    extends: Item,
    discriminatorValue: 'text',
    properties: { value: p.string() },
  });
  const NumberItem = defineEntity({
    name: 'NumberItem',
    extends: Item,
    discriminatorValue: 'number',
    properties: { value: p.integer() },
  });

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({ entities: [Item, TextItem, NumberItem], dbName: ':memory:' });
    await orm.schema.create();
  });

  afterAll(() => orm.close(true));

  test('persist and load via child and root', async () => {
    const em = orm.em.fork();
    em.create(TextItem, { value: 'foo' });
    em.create(NumberItem, { value: 123 });
    await em.flush();
    em.clear();

    expect((await em.findOneOrFail(TextItem, { value: 'foo' })).value).toBe('foo');
    expect((await em.findOneOrFail(NumberItem, { value: 123 })).value).toBe(123);
    em.clear();

    const all = await em.findAll(Item, { orderBy: { id: 1 } });
    expect(all.map(i => [i.constructor.name, (i as any).value])).toEqual([
      ['TextItem', 'foo'],
      ['NumberItem', 123],
    ]);
  });
});

describe('STI children with conflicting property types and column names', () => {
  const Item = defineEntity({
    name: 'Item',
    discriminatorColumn: 'type',
    properties: {
      id: p.integer().primary(),
      type: p.string(),
    },
  });
  const TextItem = defineEntity({
    name: 'TextItem',
    extends: Item,
    discriminatorValue: 'text',
    properties: { value: p.string() },
  });
  const NumberItem = defineEntity({
    name: 'NumberItem',
    extends: Item,
    discriminatorValue: 'number',
    properties: { value: p.integer().fieldName('number_value') },
  });

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({ entities: [Item, TextItem, NumberItem], dbName: ':memory:' });
    await orm.schema.create();
  });

  afterAll(() => orm.close(true));

  test('query and load via child and root', async () => {
    const em = orm.em.fork();
    em.create(TextItem, { value: 'foo' });
    em.create(NumberItem, { value: 123 });
    await em.flush();
    em.clear();

    expect((await em.findOneOrFail(TextItem, { value: 'foo' })).value).toBe('foo');
    expect((await em.findOneOrFail(NumberItem, { value: 123 })).value).toBe(123);
    em.clear();

    const all = await em.findAll(Item, { orderBy: { id: 1 } });
    expect(all.map(i => [i.constructor.name, (i as any).value])).toEqual([
      ['TextItem', 'foo'],
      ['NumberItem', 123],
    ]);
  });
});

describe('STI children with conflicting property types and value conversion', () => {
  const Item = defineEntity({
    name: 'Item',
    abstract: true,
    discriminatorColumn: 'type',
    properties: {
      id: p.integer().primary(),
      type: p.string(),
    },
  });
  const NumberItem = defineEntity({
    name: 'NumberItem',
    extends: Item,
    discriminatorValue: 'number',
    properties: { value: p.integer() },
  });
  const BooleanItem = defineEntity({
    name: 'BooleanItem',
    extends: Item,
    discriminatorValue: 'boolean',
    properties: { value: p.boolean() },
  });

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({ entities: [Item, NumberItem, BooleanItem], dbName: ':memory:' });
    await orm.schema.create();
  });

  afterAll(() => orm.close(true));

  test('load via root keeps each subtype value', async () => {
    const em = orm.em.fork();
    em.create(NumberItem, { value: 5 });
    em.create(BooleanItem, { value: true });
    await em.flush();
    em.clear();

    const all = await em.findAll(Item, { orderBy: { id: 1 } });
    expect(all.map(i => [i.constructor.name, (i as any).value])).toEqual([
      ['NumberItem', 5],
      ['BooleanItem', true],
    ]);
  });
});

describe('STI children with conflicting property types sharing a renamed column', () => {
  const Item = defineEntity({
    name: 'Item',
    abstract: true,
    discriminatorColumn: 'type',
    properties: {
      id: p.integer().primary(),
      type: p.string(),
    },
  });
  const TextItem = defineEntity({
    name: 'TextItem',
    extends: Item,
    discriminatorValue: 'text',
    properties: { value: p.string() },
  });
  const NumberItem = defineEntity({
    name: 'NumberItem',
    extends: Item,
    discriminatorValue: 'number',
    properties: { value: p.integer().fieldName('scalar_value') },
  });
  const BooleanItem = defineEntity({
    name: 'BooleanItem',
    extends: Item,
    discriminatorValue: 'boolean',
    properties: { value: p.boolean().fieldName('scalar_value') },
  });

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({ entities: [Item, TextItem, NumberItem, BooleanItem], dbName: ':memory:' });
    await orm.schema.create();
  });

  afterAll(() => orm.close(true));

  test('load via root keeps each subtype value', async () => {
    const em = orm.em.fork();
    em.create(TextItem, { value: 'foo' });
    em.create(NumberItem, { value: 5 });
    em.create(BooleanItem, { value: true });
    await em.flush();
    em.clear();

    const all = await em.findAll(Item, { orderBy: { id: 1 } });
    expect(all.map(i => [i.constructor.name, (i as any).value])).toEqual([
      ['TextItem', 'foo'],
      ['NumberItem', 5],
      ['BooleanItem', true],
    ]);
  });
});

describe('STI grandchild inheriting a conflicting column', () => {
  const Item = defineEntity({
    name: 'Item',
    abstract: true,
    discriminatorColumn: 'type',
    properties: {
      id: p.integer().primary(),
      type: p.string(),
    },
  });
  const TextItem = defineEntity({
    name: 'TextItem',
    extends: Item,
    discriminatorValue: 'text',
    properties: { value: p.string() },
  });
  const NumberItem = defineEntity({
    name: 'NumberItem',
    extends: Item,
    discriminatorValue: 'number',
    properties: { value: p.integer().fieldName('number_value') },
  });
  const BigNumberItem = defineEntity({
    name: 'BigNumberItem',
    extends: NumberItem,
    discriminatorValue: 'big',
    properties: { unit: p.string() },
  });

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({ entities: [Item, TextItem, NumberItem, BigNumberItem], dbName: ':memory:' });
    await orm.schema.create();
  });

  afterAll(() => orm.close(true));

  test('persists into the inherited column', async () => {
    const em = orm.em.fork();
    em.create(TextItem, { value: 'foo' });
    em.create(BigNumberItem, { value: 123, unit: 'kg' });
    await em.flush();
    em.clear();

    expect((await em.findOneOrFail(BigNumberItem, { value: 123 })).value).toBe(123);
    em.clear();

    const all = await em.findAll(Item, { orderBy: { id: 1 } });
    expect(all.map(i => [i.constructor.name, (i as any).value])).toEqual([
      ['TextItem', 'foo'],
      ['BigNumberItem', 123],
    ]);
  });
});

describe('STI conflicting column followed by a sibling matching the root column', () => {
  const Item = defineEntity({
    name: 'Item',
    abstract: true,
    discriminatorColumn: 'type',
    properties: {
      id: p.integer().primary(),
      type: p.string(),
    },
  });
  const TextItem = defineEntity({
    name: 'TextItem',
    extends: Item,
    discriminatorValue: 'text',
    properties: { value: p.string().fieldName('text_value') },
  });
  const OtherItem = defineEntity({
    name: 'OtherItem',
    extends: Item,
    discriminatorValue: 'other',
    properties: { value: p.string().fieldName('other_value') },
  });
  const LongTextItem = defineEntity({
    name: 'LongTextItem',
    extends: Item,
    discriminatorValue: 'long',
    properties: { value: p.string().fieldName('text_value') },
  });

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({ entities: [Item, TextItem, OtherItem, LongTextItem], dbName: ':memory:' });
    await orm.schema.create();
  });

  afterAll(() => orm.close(true));

  test('persists each subtype into its own column', async () => {
    const em = orm.em.fork();
    em.create(TextItem, { value: 'foo' });
    em.create(OtherItem, { value: 'bar' });
    em.create(LongTextItem, { value: 'baz' });
    await em.flush();
    em.clear();

    expect(await em.execute('select type, text_value, other_value from item order by id')).toEqual([
      { type: 'text', text_value: 'foo', other_value: null },
      { type: 'other', text_value: null, other_value: 'bar' },
      { type: 'long', text_value: 'baz', other_value: null },
    ]);
    expect((await em.findOneOrFail(OtherItem, { value: 'bar' })).value).toBe('bar');
  });
});
