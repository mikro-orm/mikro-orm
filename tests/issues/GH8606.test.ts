import { Collection, MikroORM } from '@mikro-orm/postgresql';
import { Entity, ManyToOne, OneToMany, PrimaryKey, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
class Parent {
  @PrimaryKey()
  id!: number;

  @OneToMany(() => RestrictChild, child => child.parent)
  restrictChildren = new Collection<RestrictChild>(this);

  @OneToMany(() => NoActionChild, child => child.parent)
  noActionChildren = new Collection<NoActionChild>(this);

  @OneToMany(() => CascadeChild, child => child.parent)
  cascadeChildren = new Collection<CascadeChild>(this);

  @OneToMany(() => SetNullChild, child => child.parent)
  setNullChildren = new Collection<SetNullChild>(this);
}

@Entity()
class RestrictChild {
  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Parent, { nullable: true, deleteRule: 'restrict' })
  parent?: Parent;
}

@Entity()
class NoActionChild {
  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Parent, { nullable: true, deleteRule: 'no action' })
  parent?: Parent;
}

@Entity()
class CascadeChild {
  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Parent, { nullable: true, deleteRule: 'cascade' })
  parent?: Parent;
}

@Entity()
class SetNullChild {
  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Parent, { nullable: true })
  parent?: Parent;
}

type ChildClass = typeof RestrictChild | typeof NoActionChild | typeof CascadeChild | typeof SetNullChild;

describe('GH issue 8606', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [Parent, RestrictChild, NoActionChild, CascadeChild, SetNullChild],
      dbName: 'mikro_orm_test_gh_8606',
    });
    await orm.schema.refresh();
  });

  beforeEach(() => orm.schema.clear());

  afterAll(() => orm.close(true));

  async function createParentWithChild(Child: ChildClass) {
    const parent = orm.em.create(Parent, { id: 1 });
    orm.em.create(Child, { id: 1, parent });
    await orm.em.flush();
    orm.em.clear();
  }

  async function loadParent(collection: Exclude<keyof Parent, 'id'>, loaded: boolean) {
    return orm.em.findOneOrFail(Parent, 1, { populate: loaded ? [collection] : [] });
  }

  async function findChild(Child: ChildClass) {
    const [child] = await orm.em.getConnection().execute(`select * from ${orm.getMetadata(Child).tableName}`);
    return child;
  }

  describe.each([
    ['restrict', RestrictChild, 'restrictChildren'],
    ['no action', NoActionChild, 'noActionChildren'],
  ] as const)('%s', (_, Child, collection) => {
    test.each([true, false])('refuses the delete (loaded: %s)', async loaded => {
      await createParentWithChild(Child);
      const parent = await loadParent(collection, loaded);
      await expect(orm.em.remove(parent).flush()).rejects.toThrow(/foreign key constraint/);
      await expect(findChild(Child)).resolves.toEqual({ id: 1, parent_id: 1 });

      if (loaded) {
        expect(parent[collection][0].parent).toBe(parent);
      }
    });
  });

  test.each([true, false])('cascade deletes the child (loaded: %s)', async loaded => {
    await createParentWithChild(CascadeChild);
    const parent = await loadParent('cascadeChildren', loaded);
    await orm.em.remove(parent).flush();
    await expect(findChild(CascadeChild)).resolves.toBeUndefined();
    await expect(orm.em.flush()).resolves.toBeUndefined();
  });

  test.each([true, false])('set null unlinks the child (loaded: %s)', async loaded => {
    await createParentWithChild(SetNullChild);
    const parent = await loadParent('setNullChildren', loaded);
    await orm.em.remove(parent).flush();
    await expect(findChild(SetNullChild)).resolves.toEqual({ id: 1, parent_id: null });
  });
});
