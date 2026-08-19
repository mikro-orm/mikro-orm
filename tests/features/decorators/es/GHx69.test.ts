import { MikroORM } from '@mikro-orm/sqlite';
import { BeforeCreate, Check, Entity, Index, PrimaryKey, Property, Trigger, Unique } from '@mikro-orm/decorators/es';

// With TC39 decorators, a subclass metadata object has the parent class metadata as its
// prototype. Decorators like `@Check()` used to initialize their collections via
// `meta.checks ??= []`, where the read resolves an array owned by a base class through the
// prototype chain, so the subsequent `push()` mutated the base class metadata instead of
// creating an own copy on the subclass. Since `@Entity()` transfers only own properties of
// the metadata object, such items were silently dropped for the subclass. Affected
// collections: `checks`, `indexes`, `uniques`, `triggers` and `hooks`.

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
