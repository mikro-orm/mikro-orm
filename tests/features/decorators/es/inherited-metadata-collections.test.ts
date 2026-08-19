import { MikroORM } from '@mikro-orm/sqlite';
import { BeforeCreate, Check, Entity, Index, PrimaryKey, Property, Trigger, Unique } from '@mikro-orm/decorators/es';

// Inheritance of `checks`, `indexes`, `uniques`, `triggers` and `hooks` with TC39 decorators,
// where the subclass metadata object has the base class metadata as its prototype (GH #8178).

abstract class BaseWithProperty {
  @PrimaryKey({ type: 'number' })
  id!: number;

  @Property({ type: 'string' })
  tenant!: string;
}

@Entity()
@Check({ expression: 'price >= 0' })
class Product extends BaseWithProperty {
  @Property({ type: 'number', check: 'price != 1' })
  price!: number;

  @Property({ type: 'string' })
  @Check({ expression: `sku != ''` })
  sku!: string;
}

abstract class BaseWithIndexes {
  @PrimaryKey({ type: 'number' })
  id!: number;

  @Property({ type: 'string' })
  @Index()
  tenant!: string;

  @Property({ type: 'string' })
  @Unique()
  slug!: string;
}

@Entity()
class Article extends BaseWithIndexes {
  @Property({ type: 'string' })
  @Index()
  title!: string;

  @Property({ type: 'string' })
  @Unique()
  isbn!: string;
}

@Entity({ abstract: true })
@Check({ expression: 'balance >= 0' })
class AccountBase {
  @PrimaryKey({ type: 'number' })
  id!: number;

  @Property({ type: 'number' })
  balance!: number;
}

@Entity()
@Check({ expression: 'overdraft <= 0' })
class Account extends AccountBase {
  @Property({ type: 'number' })
  overdraft!: number;
}

const firedHooks: string[] = [];

abstract class BaseWithHook {
  @PrimaryKey({ type: 'number' })
  id!: number;

  @BeforeCreate()
  baseHook(): void {
    firedHooks.push('base');
  }
}

@Entity()
class HookedEntity extends BaseWithHook {
  @Property({ type: 'string' })
  name!: string;

  @BeforeCreate()
  ownHook(): void {
    firedHooks.push('own');
  }
}

@Trigger({
  name: 'trg_base',
  timing: 'after',
  events: ['insert'],
  body: 'select 1',
})
class BaseWithTrigger {
  @PrimaryKey({ type: 'number' })
  id!: number;
}

@Entity()
@Trigger({
  name: 'trg_own',
  timing: 'after',
  events: ['insert'],
  body: 'select 2',
})
class TriggeredEntity extends BaseWithTrigger {
  @Property({ type: 'string' })
  name!: string;
}

@Entity()
@Check({ expression: 'base_col >= 0' })
@Trigger({
  name: 'trg_concrete_base',
  timing: 'after',
  events: ['insert'],
  body: 'select 3',
})
class ConcreteBase {
  @PrimaryKey({ type: 'number' })
  id!: number;

  @Property({ type: 'number' })
  baseCol!: number;
}

@Entity()
@Check({ expression: 'own_col >= 0' })
@Trigger({
  name: 'trg_concrete_own',
  timing: 'after',
  events: ['insert'],
  body: 'select 4',
})
class ConcreteSub extends ConcreteBase {
  @Property({ type: 'number' })
  ownCol!: number;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [Product, Article, AccountBase, Account, HookedEntity, TriggeredEntity],
  });
  await orm.schema.refresh();
});

afterAll(() => orm.close(true));

test('subclass @Check survives a base class with @Property', async () => {
  const meta = orm.getMetadata().get(Product);
  expect(meta.checks).toHaveLength(3);
  expect(meta.checks.map(c => c.expression)).toEqual(expect.arrayContaining(['price >= 0', 'price != 1', `sku != ''`]));

  const sql = await orm.schema.getCreateSchemaSQL();
  expect(sql).toContain('price >= 0');
  expect(sql).toContain('price != 1');
  expect(sql).toContain(`sku != ''`);
});

test('subclass @Index/@Unique survive a base class with @Index/@Unique', async () => {
  const sql = await orm.schema.getCreateSchemaSQL();
  expect(sql).toContain('article_tenant_index');
  expect(sql).toContain('article_title_index');
  expect(sql).toContain('article_slug_unique');
  expect(sql).toContain('article_isbn_unique');
});

test('checks inherited from an abstract entity base are not duplicated', async () => {
  const meta = orm.getMetadata().get(Account);
  expect(meta.checks).toHaveLength(2);
  expect(meta.checks.map(c => c.expression)).toEqual(expect.arrayContaining(['balance >= 0', 'overdraft <= 0']));
});

test('hooks declared on both base and subclass all fire', async () => {
  const meta = orm.getMetadata().get(HookedEntity);
  expect(meta.hooks.beforeCreate).toHaveLength(2);

  const e = new HookedEntity();
  e.name = 'foo';
  await orm.em.persist(e).flush();
  expect(firedHooks.sort()).toEqual(['base', 'own']);
});

test('subclass @Trigger survives a base class with @Trigger', async () => {
  const meta = orm.getMetadata().get(TriggeredEntity);
  expect(meta.triggers.map(t => t.name)).toEqual(['trg_base', 'trg_own']);
});

test('collections inherited from a concrete entity base are not duplicated', async () => {
  // separate ORM instance, as the base trigger propagates to the subclass table under the same
  // name, which sqlite rejects on schema execution
  const orm2 = await MikroORM.init({
    dbName: ':memory:',
    entities: [ConcreteBase, ConcreteSub],
  });

  try {
    const base = orm2.getMetadata().get(ConcreteBase);
    const sub = orm2.getMetadata().get(ConcreteSub);
    expect(base.checks.map(c => c.expression)).toEqual(['base_col >= 0']);
    expect(base.triggers.map(t => t.name)).toEqual(['trg_concrete_base']);
    expect(sub.checks.map(c => c.expression)).toEqual(['base_col >= 0', 'own_col >= 0']);
    expect(sub.triggers.map(t => t.name)).toEqual(['trg_concrete_base', 'trg_concrete_own']);
  } finally {
    await orm2.close(true);
  }
});
