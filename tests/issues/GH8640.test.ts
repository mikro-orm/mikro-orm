import {
  type Dictionary,
  EntitySchema,
  MikroORM,
  Ref,
  ref,
  ScalarRef,
  Type,
  ValidationError,
} from '@mikro-orm/postgresql';
import { Entity, ManyToOne, OneToOne, PrimaryKey, Property, Unique } from '@mikro-orm/decorators/legacy';
import { mockLogger } from '../helpers.js';

// `Product.category` references the target PK plus another column of a composite unique key,
// and owns both FK columns.
@Entity()
@Unique({ properties: ['id', 'active'] })
class Category {
  @PrimaryKey({ type: 'integer' })
  id!: number;

  @Property({ type: 'boolean' })
  active!: boolean;
}

@Entity()
class Product {
  @PrimaryKey({ type: 'integer' })
  id!: number;

  @ManyToOne(() => Category, {
    ref: true,
    nullable: true,
    joinColumns: ['category_id', 'category_active'],
    referencedColumnNames: ['id', 'active'],
  })
  category?: Ref<Category> | null;

  @Property({ type: 'integer', nullable: true, onUpdate: () => 1 })
  revision?: number;
}

@Entity()
class Banner {
  @PrimaryKey({ type: 'integer' })
  id!: number;

  @OneToOne(() => Category, {
    ref: true,
    owner: true,
    joinColumns: ['category_id', 'category_active'],
    referencedColumnNames: ['id', 'active'],
  })
  category!: Ref<Category>;
}

class LowerCaseType extends Type<string, string> {
  override convertToDatabaseValue(value: string): string {
    return value.toLowerCase();
  }

  override getColumnType(): string {
    return 'varchar(255)';
  }
}

// the FK references only non-PK columns of the target
@Entity()
@Unique({ properties: ['x', 'y'] })
class Point {
  @PrimaryKey({ type: 'integer' })
  id!: number;

  @Property({ type: 'integer', ref: true })
  x!: ScalarRef<number>;

  @Property({ type: LowerCaseType })
  y!: string;
}

@Entity()
class Marker {
  @PrimaryKey({ type: 'integer' })
  id!: number;

  @ManyToOne(() => Point, { ref: true, joinColumns: ['point_x', 'point_y'], referencedColumnNames: ['x', 'y'] })
  point!: Ref<Point>;
}

// the extra FK column is owned by another property, which fills it
@Entity()
class Tenant {
  @PrimaryKey({ type: 'integer' })
  id!: number;
}

@Entity()
@Unique({ properties: ['id', 'tenant'] })
class Project {
  @PrimaryKey({ type: 'integer' })
  id!: number;

  @ManyToOne(() => Tenant, { ref: true })
  tenant!: Ref<Tenant>;
}

@Entity()
class Task {
  @PrimaryKey({ type: 'integer' })
  id!: number;

  @ManyToOne(() => Tenant, { ref: true })
  tenant!: Ref<Tenant>;

  @ManyToOne(() => Project, {
    ref: true,
    joinColumns: ['project_id', 'tenant_id'],
    referencedColumnNames: ['id', 'tenant_id'],
  })
  project!: Ref<Project>;
}

// the extra FK column references a relation of the target, and is owned by this relation
@Entity()
class Note {
  @PrimaryKey({ type: 'integer' })
  id!: number;

  @ManyToOne(() => Project, {
    ref: true,
    joinColumns: ['project_id', 'project_tenant_id'],
    referencedColumnNames: ['id', 'tenant_id'],
  })
  project!: Ref<Project>;
}

// a `mapToPk` relation is given the whole FK value
@Entity()
class Coupon {
  @PrimaryKey({ type: 'integer' })
  id!: number;

  @ManyToOne(() => Category, {
    mapToPk: true,
    joinColumns: ['category_id', 'category_active'],
    referencedColumnNames: ['id', 'active'],
  })
  category!: [number, boolean];
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Category, Product, Banner, Coupon, Point, Marker, Tenant, Project, Task, Note],
    dbName: 'mikro_orm_test_gh8640',
  });
  await orm.schema.refresh();
});

beforeEach(async () => {
  await orm.schema.clear();
});

afterAll(() => orm.close(true));

async function rows(table: string) {
  return orm.em.getConnection().execute(`select * from "${table}" order by "id"`);
}

test('extra FK columns get the type of the referenced column', async () => {
  expect(orm.getMetadata(Product).properties.category.columnTypes).toEqual(['int', 'boolean']);
  expect(orm.getMetadata(Marker).properties.point.columnTypes).toEqual(['int', 'varchar(255)']);

  const sql = await orm.schema.getCreateSchemaSQL({ wrap: false });
  expect(sql).toMatch('"category_id" int null, "category_active" boolean null');
  expect(sql).toMatch('"point_x" int not null, "point_y" varchar(255) not null');
  expect(sql).toMatch('foreign key ("category_id", "category_active") references "category" ("id", "active")');
});

test('extra FK columns are filled from the target on insert and update', async () => {
  const em = orm.em.fork();
  const [c1, c2, c3] = [
    em.create(Category, { id: 1, active: true }),
    em.create(Category, { id: 2, active: false }),
    em.create(Category, { id: 3, active: true }),
  ];
  em.create(Product, { id: 1, category: c1 });
  await em.flush(); // single insert
  em.create(Product, { id: 2, category: c2 });
  em.create(Product, { id: 3, category: null });
  await em.flush(); // batch insert

  expect(await rows('product')).toEqual([
    { id: 1, category_id: 1, category_active: true, revision: null },
    { id: 2, category_id: 2, category_active: false, revision: null },
    { id: 3, category_id: null, category_active: null, revision: null },
  ]);

  // the snapshot of an inserted entity holds the target PK only, so nothing is left to update
  const mock = mockLogger(orm);
  await em.flush();
  expect(mock).not.toHaveBeenCalled();

  // a reference to an entity loaded in the context resolves to that entity
  em.getReference(Product, 1).category = em.getReference(Category, 2, { wrapped: true });
  await em.flush(); // single update, with `onUpdate` recomputing the payload
  em.getReference(Product, 2).category = ref(c3);
  em.getReference(Product, 3).category = ref(c1);
  await em.flush(); // batch update

  expect(await rows('product')).toEqual([
    { id: 1, category_id: 2, category_active: false, revision: 1 },
    { id: 2, category_id: 3, category_active: true, revision: 1 },
    { id: 3, category_id: 1, category_active: true, revision: 1 },
  ]);

  const em2 = orm.em.fork();
  const products = await em2.find(Product, {}, { populate: ['category'], orderBy: { id: 1 } });
  expect(products.map(p => [p.category?.id, p.category?.$.active])).toEqual([
    [2, false],
    [3, true],
    [1, true],
  ]);

  mock.mockReset();
  await em2.flush();
  expect(mock).not.toHaveBeenCalled();
  products[0].category = null;
  await em2.flush();
  expect(mock.mock.calls).toHaveLength(3);
  expect(mock.mock.calls[1][0]).toMatch(
    `update "product" set "category_id" = null, "category_active" = null where "id" = 1`,
  );
  orm.config.set('debug', false);
});

test('a reference whose extra FK value is not loaded is refused', async () => {
  await orm.em.fork().insert(Category, { id: 1, active: true });
  const em = orm.em.fork();
  em.create(Product, { id: 1, category: em.getReference(Category, 1) });
  await expect(em.flush()).rejects.toThrow(ValidationError);
  await expect(em.flush()).rejects.toThrow(
    `Cannot set Product.category to a reference of Category without the value of Category.active, load it first`,
  );
});

test('FK referencing only non-PK columns of the target', async () => {
  const em = orm.em.fork();
  // a scalar reference is unwrapped, and the value is converted by the custom type of the referenced property
  const point = em.create(Point, { id: 1, x: 10, y: 'A' });
  em.create(Marker, { id: 1, point });
  await em.flush();
  expect(await rows('marker')).toEqual([{ id: 1, point_x: 10, point_y: 'a' }]);
});

test('extra FK column owned by another property', async () => {
  const em = orm.em.fork();
  const tenant = em.create(Tenant, { id: 1 });
  const project = em.create(Project, { id: 1, tenant });
  em.create(Task, { id: 1, tenant, project });
  await em.flush();
  expect(await rows('task')).toEqual([{ id: 1, tenant_id: 1, project_id: 1 }]);
});

test('target inserted in the same flush', async () => {
  const em = orm.em.fork();
  const tenant = em.create(Tenant, {});
  const project = em.create(Project, { tenant });
  const note = em.create(Note, { project });
  const product = em.create(Product, { category: em.create(Category, { active: true }) });
  await em.flush();

  expect(await rows('note')).toEqual([{ id: note.id, project_id: project.id, project_tenant_id: tenant.id }]);
  expect(await rows('product')).toEqual([
    { id: product.id, category_id: product.category!.id, category_active: true, revision: null },
  ]);

  // the target PK is known now, a new target is inserted in the same flush again
  const note2 = em.create(Note, { project });
  product.category = ref(em.create(Category, { active: false }));
  await em.flush();

  expect(await rows('note')).toEqual([
    { id: note.id, project_id: project.id, project_tenant_id: tenant.id },
    { id: note2.id, project_id: project.id, project_tenant_id: tenant.id },
  ]);
  expect(await rows('product')).toEqual([
    { id: product.id, category_id: product.category.id, category_active: false, revision: 1 },
  ]);
});

test('one-to-one owner', async () => {
  const em = orm.em.fork();
  const category = em.create(Category, { id: 1, active: true });
  em.create(Banner, { id: 1, category });
  await em.flush();
  expect(await rows('banner')).toEqual([{ id: 1, category_id: 1, category_active: true }]);
});

test('FK referencing a column the target does not map keeps the PK type', async () => {
  const Target = new EntitySchema({
    name: 'Target',
    properties: { id: { type: 'integer', primary: true } },
  });
  const Owner = new EntitySchema({
    name: 'Owner',
    properties: {
      id: { type: 'integer', primary: true },
      target: {
        kind: 'm:1',
        entity: () => Target,
        joinColumns: ['target_id', 'target_code'],
        referencedColumnNames: ['id', 'code'],
      },
    },
  });
  const orm2 = new MikroORM({ entities: [Target, Owner], dbName: 'mikro_orm_test_gh8640' });
  const prop = orm2.getMetadata(Owner).properties.target;
  expect(prop.columnTypes).toEqual(['int', 'int']);
  expect(prop.referencedProps).toBeUndefined();
  await orm2.close();
});

test('mapToPk relation with the whole FK value', async () => {
  const em = orm.em.fork();
  em.create(Category, { id: 1, active: true });
  em.create(Coupon, { id: 1, category: [1, true] });
  await em.flush();
  expect(await rows('coupon')).toEqual([{ id: 1, category_id: 1, category_active: true }]);
});

test('native inserts, upserts and updates', async () => {
  const em = orm.em.fork();
  const [c1, c2] = [em.create(Category, { id: 1, active: true }), em.create(Category, { id: 2, active: false })];
  const point = em.create(Point, { id: 1, x: 10, y: 'a' });
  await em.flush();

  await em.insert(Product, { id: 1, category: c1 });
  await em.insertMany(Product, [
    { id: 2, category: ref(c2) },
    { id: 3, category: { id: 1, active: true } },
  ]);
  // a target given by its PK is looked up in the identity map, a ready tuple is the FK value already
  await em.insert(Product, { id: 4, category: 2 });
  await em.insert(Product, { id: 5, category: [2, false] as never });
  await em.upsert(Product, { id: 6, category: c2 });
  await em.upsertMany(Product, [{ id: 7, category: c1 }]);
  await em.nativeUpdate(Product, { id: 1 }, { category: c2 });
  await em.insert(Marker, { id: 1, point });

  expect(await rows('product')).toEqual([
    { id: 1, category_id: 2, category_active: false, revision: null },
    { id: 2, category_id: 2, category_active: false, revision: null },
    { id: 3, category_id: 1, category_active: true, revision: null },
    { id: 4, category_id: 2, category_active: false, revision: null },
    { id: 5, category_id: 2, category_active: false, revision: null },
    { id: 6, category_id: 2, category_active: false, revision: null },
    { id: 7, category_id: 1, category_active: true, revision: null },
  ]);
  expect(await rows('marker')).toEqual([{ id: 1, point_x: 10, point_y: 'a' }]);

  await expect(orm.em.fork().insert(Product, { id: 8, category: 1 })).rejects.toThrow(
    `Cannot set Product.category to a reference of Category without the value of Category.active, load it first`,
  );
});

test('a relation replaced in a `beforeUpsert` hook', async () => {
  let replace = true;
  // the hook gets the upserted data, a plain object, so the subscriber is not limited to the entity class
  orm.em.getEventManager().registerSubscriber({
    beforeUpsert: args => {
      if (replace && args.meta.class === Product) {
        (args.entity as Dictionary).category = 1;
      }
    },
  });

  const em = orm.em.fork();
  const c2 = em.create(Category, { id: 2, active: false });
  em.create(Category, { id: 1, active: true });
  await em.flush();

  // the hook gives only the PK, so the target is looked up in the identity map, not taken from the original data
  await em.upsert(Product, { id: 1, category: c2 });
  await em.upsertMany(Product, [{ id: 2, category: c2 }]);
  replace = false;

  expect(await rows('product')).toEqual([
    { id: 1, category_id: 1, category_active: true, revision: null },
    { id: 2, category_id: 1, category_active: true, revision: null },
  ]);
});
