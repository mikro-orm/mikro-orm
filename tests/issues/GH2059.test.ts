import { Collection, Entity, ManyToOne, MikroORM, OneToMany, PrimaryKey, Property, wrap } from '@mikro-orm/core';
import type { SqliteDriver } from '@mikro-orm/sqlite';

@Entity()
class Category {

  @PrimaryKey()
  id!: number;

  @Property()
  name: string;

  @ManyToOne({ entity: () => Category, nullable: true })
  parent?: Category;

  @OneToMany({ entity: () => Category, mappedBy: c => c.parent })
  children = new Collection<Category>(this);

  constructor(name: string, parent?: Category) {
    this.name = name;
    this.parent = parent;
  }

}

describe('GH issue 2059', () => {

  let orm: MikroORM<SqliteDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Category],
      dbName: ':memory:',
      type: 'sqlite',
    });
    await orm.getSchemaGenerator().createSchema();
  });

  afterAll(async () => {
    await orm.close(true);
  });

  test(`GH issue 2059`, async () => {
    const a = new Category('A');
    const a1 = new Category('A1', a);
    const a11 = new Category('A11', a1);
    const a111 = new Category('A111', a11);
    const a2 = new Category('A2', a);
    const b = new Category('B');
    const b1 = new Category('B1', b);
    const b2 = new Category('B2', b);
    await orm.em.fork().persistAndFlush([a, b]);

    /*
    Current tree structure is:
        - CAT A
           | - CAT A1
           |     |  - CAT A11
           |     |     |  - CAT A111
           | - CAT A2
        - CAT B
           | - CAT B1
           | - CAT B2
     */

    // Load root categories and populate children and children of children
    const categories = await orm.em.find(
      Category,
      { parent: null },
      { populate: ['children.children'] },
    );

    expect(categories[0].children[0].children[0].name).toBe('A11');
    await categories[0].children[0].children[0].children.init();
    expect(categories[0].children[0].children[0].children[0].name).toBe('A111');
    expect(wrap(categories[0]).toObject().children[0].children[0].children).toBeUndefined();
    expect(wrap(categories[0]).toObject()).toMatchObject({
      name: 'A',
      children: [
        { name: 'A1', children: [{ name: 'A11' }] },
        { name: 'A2' },
      ],
    });
  });

});
